package com.vietnl.hwin.affiliate.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
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
public class RecordReferralClickRequest {

    @NotBlankValidator(field = "Mã")
    @LengthValidator(max = 32, field = "Mã")
    private String code;
    @LengthValidator(max = 500, field = "Trang đích")
    private String landingPath;
    /** Nền tảng chia sẻ (?src= của link): facebook, zalo, tiktok, youtube, instagram; giá trị khác -> OTHER. */
    @LengthValidator(max = 32, field = "Nguồn")
    private String source;
}
