package com.vietnl.hwin.ordering.entity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.ordering.entity.OrderEnums.CancelReason;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentStatus;

/** Unit test quy tắc nghiệp vụ của aggregate Order (không cần Spring/DB). */
class OrderTest {

    private static final UUID ADMIN = UUID.randomUUID();
    private static final UUID CUSTOMER = UUID.randomUUID();
    private static final UUID P1 = UUID.randomUUID();
    private static final UUID P2 = UUID.randomUUID();
    private static final Instant T0 = Instant.parse("2026-01-01T00:00:00Z");
    private static final Duration WINDOW = Duration.ofDays(7);
    private static final Address ADDRESS = new Address("Nguyễn Văn A", PhoneNumber.of("0912345678"),
            "Hà Nội", "Cầu Giấy", "Dịch Vọng", "1 Xuân Thủy");

    private static Order newOrder(PaymentMethod method) {
        List<OrderLine> lines = List.of(
                new OrderLine(P1, "Chả lụa", "cha-lua", null, Money.of(95_000), 2),
                new OrderLine(P2, "Giò thủ", "gio-thu", null, Money.of(120_000), 1));
        return Order.place(CUSTOMER, "HW260101ABCD", lines, Money.of(30_000), ADDRESS, method, null, null, "ABC123", T0);
    }

    @Test
    void placeComputesTotalsOnBackend() {
        Order o = newOrder(PaymentMethod.COD);
        assertThat(o.getSubtotal()).isEqualTo(Money.of(310_000));
        assertThat(o.getDiscount()).isEqualTo(Money.ZERO);
        assertThat(o.getTotal()).isEqualTo(Money.of(340_000));
        assertThat(o.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(o.getPaymentStatus()).isEqualTo(PaymentStatus.UNPAID);
    }

    @Test
    void emptyCartCannotBePlaced() {
        assertThatThrownBy(() -> Order.place(CUSTOMER, "X", List.of(), Money.ZERO, ADDRESS, PaymentMethod.COD, null, null,
                null, T0)).isInstanceOf(DomainException.class).hasFieldOrPropertyWithValue("code", "CART_EMPTY");
    }

    @Test
    void fullCodLifecycleMarksPaidOnDelivery() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        o.markShipping(ADMIN, T0);
        o.markDelivered(ADMIN, T0);
        assertThat(o.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(o.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        o.complete(WINDOW, T0.plus(Duration.ofDays(8)));
        assertThat(o.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void bankQrMustBePaidBeforeConfirm() {
        Order o = newOrder(PaymentMethod.BANK_QR);
        assertThatThrownBy(() -> o.confirm(ADMIN, T0)).hasFieldOrPropertyWithValue("code", "PAYMENT_REQUIRED");
        o.markPaid("FT123", ADMIN, T0);
        o.confirm(ADMIN, T0);
        assertThat(o.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    void codCannotBeMarkedPaidManually() {
        Order o = newOrder(PaymentMethod.COD);
        assertThatThrownBy(() -> o.markPaid("x", ADMIN, T0)).hasFieldOrPropertyWithValue("code", "PAYMENT_METHOD_INVALID");
    }

    @Test
    void customerCanOnlyCancelPending() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        assertThatThrownBy(() -> o.cancel(CancelReason.CUSTOMER_REQUEST, CUSTOMER, true, T0))
                .hasFieldOrPropertyWithValue("code", Order.INVALID_STATE);
        // admin vẫn hủy được khi CONFIRMED
        o.cancel(CancelReason.ADMIN, ADMIN, false, T0);
        assertThat(o.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    void cannotCancelAfterShipping() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        o.markShipping(ADMIN, T0);
        assertThatThrownBy(() -> o.cancel(CancelReason.ADMIN, ADMIN, false, T0)).isInstanceOf(DomainException.class);
    }

    @Test
    void returnOnlyWithinWindow() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        o.markShipping(ADMIN, T0);
        o.markDelivered(ADMIN, T0);
        assertThatThrownBy(() -> o.markReturned(ADMIN, WINDOW, T0.plus(Duration.ofDays(8))))
                .hasFieldOrPropertyWithValue("code", "RETURN_WINDOW_EXPIRED");
        o.markReturned(ADMIN, WINDOW, T0.plus(Duration.ofDays(3)));
        assertThat(o.getStatus()).isEqualTo(OrderStatus.RETURNED);
    }

    @Test
    void cannotCompleteBeforeWindowEnds() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        o.markShipping(ADMIN, T0);
        o.markDelivered(ADMIN, T0);
        assertThatThrownBy(() -> o.complete(WINDOW, T0.plus(Duration.ofDays(2))))
                .hasFieldOrPropertyWithValue("code", "RETURN_WINDOW_OPEN");
    }

    @Test
    void statusHistoryIsRecorded() {
        Order o = newOrder(PaymentMethod.COD);
        o.confirm(ADMIN, T0);
        o.markShipping(ADMIN, T0);
        assertThat(o.getHistory()).extracting(OrderStatusHistory::getToStatus)
                .containsExactly(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING);
    }

    @Test
    void cartCapsQuantityAt99() {
        Cart c = Cart.createFor(CUSTOMER);
        c.add(P1, 60, T0);
        c.add(P1, 60, T0);
        assertThat(c.getItems()).singleElement().extracting(CartItem::getQuantity).isEqualTo(99);
        assertThatThrownBy(() -> c.add(P2, 0, T0)).hasFieldOrPropertyWithValue("code", "QUANTITY_INVALID");
    }
}
