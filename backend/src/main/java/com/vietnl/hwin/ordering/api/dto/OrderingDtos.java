package com.vietnl.hwin.ordering.api.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;

/** DTO của module ordering. Tiền là số nguyên VND. */
public final class OrderingDtos {

    private OrderingDtos() {
    }

    private static final String PHONE = "^[0-9+ .\\-]{9,16}$";

    // ------------------------------------------------------------------ giỏ hàng

    public record CartItemRequest(@NotNull Long productId, @Min(1) @Max(99) int quantity) {
    }

    public record QuantityRequest(@Min(1) @Max(99) int quantity) {
    }

    /** Giỏ localStorage gửi lên để gộp (merge) hoặc tính giá (quote). */
    public record CartLinesRequest(@NotNull @Size(max = 50) List<@Valid CartItemRequest> items) {
    }

    // ------------------------------------------------------------------ đặt hàng

    public record AddressDto(
            @NotBlank @Size(max = 100) String recipientName,
            @NotBlank @Pattern(regexp = PHONE, message = "Số điện thoại không hợp lệ") String recipientPhone,
            @NotBlank @Size(max = 100) String province,
            @NotBlank @Size(max = 100) String district,
            @NotBlank @Size(max = 100) String ward,
            @NotBlank @Size(max = 255) String street) {
    }

    public record VatInvoiceDto(
            @NotBlank @Size(max = 255) String companyName,
            @NotBlank @Pattern(regexp = "^\\d{10}(-\\d{3})?$", message = "Mã số thuế gồm 10 số (hoặc 10 số-3 số)") String taxCode,
            @NotBlank @Size(max = 500) String address,
            @NotBlank @Size(max = 255) String email) {
    }

    /**
     * @param idempotencyKey chuỗi ngẫu nhiên do client sinh cho mỗi lần bấm "Đặt hàng" – gửi lại cùng key
     *                       (mạng chập chờn) sẽ nhận lại đúng đơn cũ thay vì tạo đơn trùng
     */
    public record PlaceOrderRequest(
            @NotNull @Valid AddressDto shippingAddress,
            @NotNull PaymentMethod paymentMethod,
            @Valid VatInvoiceDto vatInvoice,
            @Size(max = 500) String note,
            @Size(max = 64) String idempotencyKey) {
    }

    public record CheckoutConfigResponse(long shippingFee, List<String> paymentMethods) {
    }

    // ------------------------------------------------------------------ đơn hàng

    public record AddressResponse(String recipientName, String recipientPhone, String province, String district,
                                  String ward, String street, String fullText) {
    }

    public record VatInvoiceResponse(String companyName, String taxCode, String address, String email) {
    }

    public record OrderItemResponse(Long productId, String productName, String productSlug, String imageUrl,
                                    long unitPrice, int quantity, long lineTotal) {
    }

    /** Hướng dẫn chuyển khoản (chỉ có khi BANK_QR chưa thanh toán). */
    public record PaymentInstructionResponse(String qrImageUrl, String bankBin, String accountNo, String accountName,
                                             long amount, String transferContent) {
    }

    public record OrderSummaryResponse(String code, String status, String paymentMethod, String paymentStatus,
                                       long total, int itemCount, String firstItemName, String firstItemImage,
                                       Instant placedAt) {
    }

    public record OrderDetailResponse(String code, String status, String paymentMethod, String paymentStatus,
                                      long subtotal, long discount, long shippingFee, long total,
                                      AddressResponse shippingAddress, VatInvoiceResponse vatInvoice, String note,
                                      List<OrderItemResponse> items, Instant placedAt, Instant confirmedAt,
                                      Instant shippedAt, Instant deliveredAt, Instant completedAt,
                                      Instant cancelledAt, Instant returnedAt, String cancelReason,
                                      boolean cancellable, PaymentInstructionResponse payment) {
    }

    public record HistoryResponse(String fromStatus, String toStatus, Long actorId, String note, Instant at) {
    }

    /** Chi tiết cho admin: thêm id, khách, mã CTV, mã giao dịch, lịch sử trạng thái. */
    public record AdminOrderResponse(Long id, Long customerId, String referralCode, String paymentRef,
                                     OrderDetailResponse detail, List<HistoryResponse> history) {
    }

    public record AdminOrderRow(Long id, String code, Long customerId, String recipientName, String recipientPhone,
                                String status, String paymentMethod, String paymentStatus, long total,
                                String referralCode, Instant placedAt) {
    }

    public record MarkPaidRequest(@Size(max = 100) String paymentRef) {
    }

    public record AdminCancelRequest(@Pattern(regexp = "ADMIN|OUT_OF_STOCK|PAYMENT_TIMEOUT|CUSTOMER_REQUEST") String reason) {
    }
}
