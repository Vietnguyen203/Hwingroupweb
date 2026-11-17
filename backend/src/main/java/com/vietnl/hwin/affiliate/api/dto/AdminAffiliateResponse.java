package com.vietnl.hwin.affiliate.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAffiliateResponse {

    private UUID id;
    private UUID userId;
    private String fullName;
    private String phone;
    private String status;
    private String referralCode;
    private String socialLink;
    private String note;
    private String statusReason;
    private String bankName;
    private String bankAccountNoMasked;
    private Instant createdAt;
    private Instant reviewedAt;
    private UUID reviewedBy;
    /** Đã nộp ảnh CCCD chưa (ảnh chỉ xem qua API riêng, không lộ khóa file). */
    private boolean hasIdCard;
}
