package com.vietnl.hwin.ordering.api.mapper;

import java.util.UUID;

import java.util.List;
import java.util.Map;

import org.mapstruct.Mapper;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AddressDto;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AddressResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AdminOrderResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AdminOrderRow;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.CartItemRequest;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.HistoryResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.OrderDetailResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.OrderItemResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.OrderSummaryResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.PaymentInstructionResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.VatInvoiceDto;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.VatInvoiceResponse;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderItem;
import com.vietnl.hwin.ordering.entity.OrderStatusHistory;
import com.vietnl.hwin.ordering.entity.VatInvoiceInfo;
import com.vietnl.hwin.ordering.service.integration.PaymentGateway.PaymentInstruction;

/** Map Order <-> DTO. Value object (Money, PhoneNumber, Address) đổi sang kiểu đơn giản cho JSON. */
@Mapper
public interface OrderingMapper {

    OrderItemResponse toItem(OrderItem item);

    VatInvoiceResponse toVat(VatInvoiceInfo info);

    PaymentInstructionResponse toPayment(PaymentInstruction instruction);

    default AddressResponse toAddress(Address a) {
        return a == null ? null : new AddressResponse(a.recipientName(), a.recipientPhone().local(), a.province(),
                a.district(), a.ward(), a.street(), a.fullText());
    }

    default Address toAddress(AddressDto d) {
        return new Address(d.recipientName(), PhoneNumber.of(d.recipientPhone()), d.province(), d.district(),
                d.ward(), d.street());
    }

    default VatInvoiceInfo toVat(VatInvoiceDto d) {
        return d == null ? null : new VatInvoiceInfo(d.companyName(), d.taxCode(), d.address(), d.email());
    }

    default OrderSummaryResponse toSummary(Order o) {
        List<OrderItem> items = o.getItems();
        OrderItem first = items.isEmpty() ? null : items.get(0);
        return new OrderSummaryResponse(o.getOrderCode(), o.getStatus().name(), o.getPaymentMethod().name(),
                o.getPaymentStatus().name(), o.getTotal().amount(),
                items.stream().mapToInt(OrderItem::getQuantity).sum(),
                first == null ? null : first.getProductName(), first == null ? null : first.getImageUrl(),
                o.getPlacedAt());
    }

    default OrderDetailResponse toDetail(Order o, PaymentInstruction payment) {
        return new OrderDetailResponse(o.getOrderCode(), o.getStatus().name(), o.getPaymentMethod().name(),
                o.getPaymentStatus().name(), o.getSubtotal().amount(), o.getDiscount().amount(),
                o.getShippingFee().amount(), o.getTotal().amount(), toAddress(o.getShippingAddress()),
                toVat(o.getVatInvoice()), o.getNote(), o.getItems().stream().map(this::toItem).toList(),
                o.getPlacedAt(), o.getConfirmedAt(), o.getShippedAt(), o.getDeliveredAt(), o.getCompletedAt(),
                o.getCancelledAt(), o.getReturnedAt(), o.getCancelReason() == null ? null : o.getCancelReason().name(),
                o.isCancellableByCustomer(), o.isAwaitingTransfer() && payment != null ? toPayment(payment) : null);
    }

    default AdminOrderResponse toAdmin(Order o, PaymentInstruction payment) {
        return new AdminOrderResponse(o.getId(), o.getCustomerId(), o.getReferralCode(), o.getPaymentRef(),
                toDetail(o, payment), o.getHistory().stream().map(this::toHistory).toList());
    }

    default AdminOrderRow toRow(Order o) {
        Address a = o.getShippingAddress();
        return new AdminOrderRow(o.getId(), o.getOrderCode(), o.getCustomerId(), a.recipientName(),
                a.recipientPhone().local(), o.getStatus().name(), o.getPaymentMethod().name(),
                o.getPaymentStatus().name(), o.getTotal().amount(), o.getReferralCode(), o.getPlacedAt());
    }

    default HistoryResponse toHistory(OrderStatusHistory h) {
        return new HistoryResponse(h.getFromStatus() == null ? null : h.getFromStatus().name(),
                h.getToStatus().name(), h.getActorId(), h.getNote(), h.getCreatedAt());
    }

    default Map<UUID, Integer> toQuantities(List<CartItemRequest> items) {
        java.util.LinkedHashMap<UUID, Integer> map = new java.util.LinkedHashMap<>();
        items.forEach(i -> map.merge(i.productId(), i.quantity(), Integer::sum));
        return map;
    }

    default long money(Money m) {
        return m == null ? 0 : m.amount();
    }
}
