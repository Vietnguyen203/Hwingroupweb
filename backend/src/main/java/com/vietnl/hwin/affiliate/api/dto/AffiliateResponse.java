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

/** Hồ sơ CTV – SĐT đã che, ngân hàng chỉ hiện 4 số cuối. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffiliateResponse {

    private UUID id;
    private String fullName;
    private String phoneMasked;
    private String status;
    private String referralCode;
    private String socialLink;
    private String note;
    private String statusReason;
    private String bankName;
    private String bankAccountNoMasked;
    private Instant withdrawLockedUntil;
    private Instant createdAt;
    private Instant reviewedAt;
}
