package com.vietnl.hwin.customer.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import jakarta.validation.constraints.Pattern;
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
public class UpdateProfileRequest {

    @LengthValidator(max = 100, field = "Họ tên")
    private String fullName;
}
