package com.vietnl.hwin.affiliate.api.responses;

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
public class CommissionResponse {

    private UUID id;
    private String orderCode;
    private long baseAmount;
    private BigDecimal rate;
    private long amount;
    private String status;
    private Instant createdAt;
    private Instant eligibleAt;
    private Instant approvedAt;
    private Instant cancelledAt;
}
