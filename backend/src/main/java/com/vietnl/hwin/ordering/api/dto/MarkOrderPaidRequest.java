package com.vietnl.hwin.ordering.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
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
public class MarkOrderPaidRequest {

    @LengthValidator(max = 100, field = "Mã giao dịch")
    private String paymentRef;
}
