package com.vietnl.hwin.ordering.api.dto;

import com.vietnl.hwin.ordering.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {

    private String code;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private long subtotal;
    private long discount;
    private long shippingFee;
    private long total;
    private ShippingAddressResponse shippingAddress;
    private VatInvoiceResponse vatInvoice;
    private String note;
    private List<OrderItemResponse> items;
    private Instant placedAt;
    private Instant confirmedAt;
    private Instant shippedAt;
    private Instant deliveredAt;
    private Instant completedAt;
    private Instant cancelledAt;
    private Instant returnedAt;
    private String cancelReason;
    private boolean cancellable;
    /** Khách bấm được "Đã nhận được hàng" (đơn đang giao). */
    private boolean receivable;
    private PaymentInstructionResponse payment;
}
