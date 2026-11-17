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

/** Chi tiết rút tiền cho admin – kèm số tài khoản ĐÃ GIẢI MÃ để chuyển khoản. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPayoutResponse {

    private UUID id;
    private UUID affiliateId;
    private long amount;
    private String status;
    private String bankName;
    private String accountNo;
    private String accountHolder;
    private Instant requestedAt;
    private Instant approvedAt;
    private Instant paidAt;
    private Instant rejectedAt;
    private String transactionRef;
    private String rejectReason;
    private UUID processedBy;
}
