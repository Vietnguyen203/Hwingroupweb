package com.vietnl.hwin.ordering.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
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
public class MarkPaidRequest {

    @LengthValidator(max = 100, field = "Mã giao dịch")
    private String paymentRef;
}
