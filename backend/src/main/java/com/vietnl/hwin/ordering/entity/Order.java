package com.vietnl.hwin.ordering.entity;

import com.vietnl.hwin.ordering.entity.event.OrderPlacedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderReturnedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderDeliveredEvent;
import com.vietnl.hwin.ordering.entity.event.OrderCompletedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderConfirmedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderShippedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderCancelledEvent;
import com.vietnl.hwin.ordering.entity.event.OrderItemSnapshot;
import java.util.Map;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import org.hibernate.annotations.BatchSize;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.entity.PaymentStatus;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: đơn hàng. Mọi quy tắc chuyển trạng thái nằm ở đây; vi phạm -> ResponseException.
 * <pre>
 * PENDING -> CONFIRMED -> SHIPPING -> DELIVERED -> COMPLETED
 * PENDING|CONFIRMED -> CANCELLED      DELIVERED (trong hạn đổi trả) -> RETURNED
 * </pre>
 * Giá luôn do backend tính từ catalog (xem PlaceOrderService), không nhận từ client.
 */
@Entity
@Table(name = "orders", schema = "ordering")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends AggregateRoot<Order> {

    public static final String INVALID_STATE = "INVALID_STATE_TRANSITION";

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String orderCode;

    @Column(nullable = false)
    private UUID customerId;

    private String referralCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @Column(nullable = false)
    private Money subtotal;

    @Column(nullable = false)
    private Money discount;

    @Column(nullable = false)
    private Money shippingFee;

    @Column(nullable = false)
    private Money total;

    @Embedded
    private Address shippingAddress;

    private String note;

    private boolean vatRequested;

    @Embedded
    private VatInvoiceInfo vatInvoice;

    @Enumerated(EnumType.STRING)
    private CancelReason cancelReason;

    private String paymentRef;

    @Column(nullable = false)
    private Instant placedAt;
    private Instant confirmedAt;
    private Instant shippedAt;
    private Instant deliveredAt;
    private Instant completedAt;
    private Instant cancelledAt;
    private Instant returnedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id", nullable = false)
    @BatchSize(size = 50)
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id", nullable = false)
    @OrderBy("createdAt ASC")
    @BatchSize(size = 50)
    private List<OrderStatusHistory> history = new ArrayList<>();

    // ------------------------------------------------------------------ tạo đơn

    /**
     * Tạo đơn PENDING. Event OrderPlacedEvent được service phát sau khi lưu (cần ID).
     */
    public static Order place(UUID customerId, String orderCode, List<OrderItem> lines, Money shippingFee,
                              Address shippingAddress, PaymentMethod paymentMethod, VatInvoiceInfo vatInvoice,
                              String note, String referralCode, Instant now) {
        if (lines == null || lines.isEmpty()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CART_EMPTY);
        }
        if (shippingAddress == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADDRESS_INVALID);
        }
        if (paymentMethod == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PAYMENT_METHOD_REQUIRED);
        }
        Order o = new Order();
        o.customerId = customerId;
        o.orderCode = orderCode;
        o.items.addAll(lines);
        o.subtotal = o.items.stream().map(OrderItem::getLineTotal).reduce(Money.ZERO, Money::plus);
        o.discount = Money.ZERO; // demo chưa có voucher
        o.shippingFee = shippingFee;
        o.total = o.subtotal.minus(o.discount).plus(shippingFee);
        o.shippingAddress = shippingAddress;
        o.paymentMethod = paymentMethod;
        o.paymentStatus = PaymentStatus.UNPAID;
        o.vatInvoice = vatInvoice;
        o.vatRequested = vatInvoice != null;
        o.note = note == null || note.isBlank() ? null : note.trim();
        o.referralCode = referralCode;
        o.placedAt = now;
        o.status = OrderStatus.PENDING;
        o.history.add(new OrderStatusHistory(null, OrderStatus.PENDING, customerId, "Đặt hàng", now));
        return o;
    }

    /** Event tạo đơn – gọi sau khi đã lưu để có ID. */
    public OrderPlacedEvent placedEvent() {
        return new OrderPlacedEvent(UUID.randomUUID(), placedAt, id, orderCode, customerId, referralCode, itemSnapshots(),
                subtotal.amount(), discount.amount(), shippingFee.amount(), total.amount());
    }

    // ------------------------------------------------------------------ thanh toán

    /** Admin xác nhận đã nhận chuyển khoản (BANK_QR). */
    public void markPaid(String paymentRef, UUID actorId, Instant now) {
        if (paymentMethod != PaymentMethod.BANK_QR) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PAYMENT_METHOD_INVALID);
        }
        if (paymentStatus == PaymentStatus.PAID) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ALREADY_PAID);
        }
        requireStatus(Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED), "xác nhận thanh toán");
        this.paymentStatus = PaymentStatus.PAID;
        this.paymentRef = paymentRef == null || paymentRef.isBlank() ? null : paymentRef.trim();
        history.add(new OrderStatusHistory(status, status, actorId, "Đã nhận thanh toán " + nullToEmpty(this.paymentRef), now));
    }

    // ------------------------------------------------------------------ vòng đời

    public void confirm(UUID actorId, Instant now) {
        requireStatus(Set.of(OrderStatus.PENDING), "xác nhận");
        if (paymentMethod == PaymentMethod.BANK_QR && paymentStatus != PaymentStatus.PAID) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PAYMENT_REQUIRED);
        }
        transition(OrderStatus.CONFIRMED, actorId, null, now);
        this.confirmedAt = now;
        registerEvent(new OrderConfirmedEvent(UUID.randomUUID(), now, id, orderCode));
    }

    public void markShipping(UUID actorId, Instant now) {
        requireStatus(Set.of(OrderStatus.CONFIRMED), "giao cho vận chuyển");
        transition(OrderStatus.SHIPPING, actorId, null, now);
        this.shippedAt = now;
        registerEvent(new OrderShippedEvent(UUID.randomUUID(), now, id, orderCode, customerId));
    }

    /** Giao thành công. Đơn COD coi như đã thu tiền. */
    public void markDelivered(UUID actorId, Instant now) {
        requireStatus(Set.of(OrderStatus.SHIPPING), "đánh dấu đã giao");
        transition(OrderStatus.DELIVERED, actorId, null, now);
        this.deliveredAt = now;
        if (paymentMethod == PaymentMethod.COD) {
            this.paymentStatus = PaymentStatus.PAID;
        }
        registerEvent(new OrderDeliveredEvent(UUID.randomUUID(), now, id, orderCode, now));
    }

    /**
     * Hủy đơn. Khách chỉ tự hủy khi PENDING; admin/hệ thống hủy được khi PENDING hoặc CONFIRMED.
     */
    public void cancel(CancelReason reason, UUID actorId, boolean byCustomer, Instant now) {
        Set<OrderStatus> allowed = byCustomer ? Set.of(OrderStatus.PENDING)
                : Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED);
        if (!allowed.contains(status)) {
            if (byCustomer) {
                throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CUSTOMER_CANCEL_NOT_ALLOWED);
            }
            String action = "hủy";
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.INVALID_STATE_TRANSITION, Map.of("action", String.valueOf(action), "status", String.valueOf(status)));
        }
        transition(OrderStatus.CANCELLED, actorId, "Hủy: " + reason, now);
        this.cancelReason = reason;
        this.cancelledAt = now;
        registerEvent(new OrderCancelledEvent(UUID.randomUUID(), now, id, orderCode, customerId, itemSnapshots(),
                total.amount(), reason.name()));
    }

    /** Trả hàng: chỉ khi DELIVERED và còn trong hạn đổi trả. */
    public void markReturned(UUID actorId, Duration returnWindow, Instant now) {
        requireStatus(Set.of(OrderStatus.DELIVERED), "trả hàng");
        if (now.isAfter(deliveredAt.plus(returnWindow))) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.RETURN_WINDOW_EXPIRED, Map.of("days", String.valueOf(returnWindow.toDays())));
        }
        transition(OrderStatus.RETURNED, actorId, null, now);
        this.returnedAt = now;
        registerEvent(new OrderReturnedEvent(UUID.randomUUID(), now, id, orderCode, customerId, itemSnapshots(),
                total.amount()));
    }

    /** Hoàn tất khi đã hết hạn đổi trả (job gọi). */
    public void complete(Duration returnWindow, Instant now) {
        requireStatus(Set.of(OrderStatus.DELIVERED), "hoàn tất");
        if (!now.isAfter(deliveredAt.plus(returnWindow))) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.RETURN_WINDOW_OPEN);
        }
        transition(OrderStatus.COMPLETED, null, "Hết hạn đổi trả", now);
        this.completedAt = now;
        registerEvent(new OrderCompletedEvent(UUID.randomUUID(), now, id, orderCode));
    }

    public boolean isCancellableByCustomer() {
        return status == OrderStatus.PENDING;
    }

    public boolean isAwaitingTransfer() {
        return paymentMethod == PaymentMethod.BANK_QR && paymentStatus == PaymentStatus.UNPAID
                && (status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED);
    }

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public List<OrderStatusHistory> getHistory() {
        return Collections.unmodifiableList(history);
    }

    // ------------------------------------------------------------------ nội bộ

    private void requireStatus(Set<OrderStatus> allowed, String action) {
        if (!allowed.contains(status)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.INVALID_STATE_TRANSITION, Map.of("action", String.valueOf(action), "status", String.valueOf(status)));
        }
    }

    private void transition(OrderStatus to, UUID actorId, String note, Instant now) {
        history.add(new OrderStatusHistory(status, to, actorId, note, now));
        this.status = to;
    }

    private List<OrderItemSnapshot> itemSnapshots() {
        return items.stream()
                .map(i -> new OrderItemSnapshot(i.getProductId(), i.getProductName(), i.getQuantity(),
                        i.getUnitPrice().amount()))
                .toList();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : "(" + s + ")";
    }
}
