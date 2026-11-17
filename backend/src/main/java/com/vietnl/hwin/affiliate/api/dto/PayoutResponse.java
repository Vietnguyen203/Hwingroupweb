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
public class PayoutResponse {

    private UUID id;
    private long amount;
    private String status;
    private String bankName;
    private Instant requestedAt;
    private Instant approvedAt;
    private Instant paidAt;
    private Instant rejectedAt;
    private String transactionRef;
    private String rejectReason;
}
