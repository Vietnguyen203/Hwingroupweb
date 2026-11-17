package com.vietnl.hwin.affiliate.api.dto;

import com.vietnl.hwin.common.validation.NotNullValidator;
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
public class CreatePayoutRequest {

    @NotNullValidator(field = "Số tiền")
    @Positive
    private Long amount;
}
