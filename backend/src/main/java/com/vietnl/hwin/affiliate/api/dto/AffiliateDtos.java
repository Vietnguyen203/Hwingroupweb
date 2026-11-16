package com.vietnl.hwin.affiliate.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** DTO của module affiliate. Tiền là số nguyên VND. */
public final class AffiliateDtos {

    private AffiliateDtos() {
    }

    // ------------------------------------------------------------------ click

    public record ClickRequest(@NotBlank @Size(max = 32) String code, @Size(max = 500) String landingPath) {
    }

    // ------------------------------------------------------------------ CTV

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @Size(max = 500) String socialLink,
            @Size(max = 1000) String note,
            @AssertTrue(message = "Vui lòng đồng ý điều khoản cộng tác viên") boolean acceptTerms) {
    }

    /** Hồ sơ CTV – SĐT đã che, ngân hàng chỉ hiện 4 số cuối. */
    public record AffiliateResponse(UUID id, String fullName, String phoneMasked, String status, String referralCode,
                                    String socialLink, String note, String statusReason, String bankName,
                                    String bankAccountNoMasked, Instant withdrawLockedUntil, Instant createdAt,
                                    Instant reviewedAt) {
    }

    public record BankAccountRequest(
            @NotBlank @Size(max = 100) String bankName,
            @NotBlank @Pattern(regexp = "^[0-9 ]{6,20}$", message = "Số tài khoản chỉ gồm 6–20 chữ số") String accountNo,
            @NotBlank @Size(max = 100) String accountHolder,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp) {
    }

    public record OtpSentResponse(long expiresInSeconds) {
    }

    public record CommissionResponse(UUID id, String orderCode, long baseAmount, BigDecimal rate, long amount,
                                     String status, Instant createdAt, Instant eligibleAt, Instant approvedAt,
                                     Instant cancelledAt) {
    }

    public record PayoutRequest(@NotNull @Positive Long amount) {
    }

    public record PayoutResponse(UUID id, long amount, String status, String bankName, Instant requestedAt,
                                 Instant approvedAt, Instant paidAt, Instant rejectedAt, String transactionRef,
                                 String rejectReason) {
    }

    // ------------------------------------------------------------------ admin

    public record AdminAffiliateResponse(UUID id, UUID userId, String fullName, String phone, String status,
                                         String referralCode, String socialLink, String note, String statusReason,
                                         String bankName, String bankAccountNoMasked, Instant createdAt,
                                         Instant reviewedAt, UUID reviewedBy) {
    }

    public record ReasonRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record AdminCommissionResponse(UUID id, UUID affiliateId, UUID customerId, String orderCode, long baseAmount,
                                          long amount, String status, Instant createdAt, Instant eligibleAt,
                                          Instant approvedAt) {
    }

    /** Chi tiết rút tiền cho admin – kèm số tài khoản ĐÃ GIẢI MÃ để chuyển khoản. */
    public record AdminPayoutResponse(UUID id, UUID affiliateId, long amount, String status, String bankName,
                                      String accountNo, String accountHolder, Instant requestedAt,
                                      Instant approvedAt, Instant paidAt, Instant rejectedAt, String transactionRef,
                                      String rejectReason, UUID processedBy) {
    }

    public record PayRequest(@NotBlank @Size(max = 100) String transactionRef) {
    }

    public record ApprovalJobResponse(Instant asOf, int approved) {
    }
}
