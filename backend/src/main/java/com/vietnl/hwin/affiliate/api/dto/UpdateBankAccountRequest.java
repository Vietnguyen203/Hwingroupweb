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
public class UpdateBankAccountRequest {

    @NotBlankValidator(field = "Ngân hàng")
    @LengthValidator(max = 100, field = "Ngân hàng")
    private String bankName;
    @NotBlankValidator(field = "Số tài khoản")
    @Pattern(regexp = "^[0-9 ]{6,20}$", message = "Số tài khoản chỉ gồm 6–20 chữ số")
    private String accountNo;
    @NotBlankValidator(field = "Chủ tài khoản")
    @LengthValidator(max = 100, field = "Chủ tài khoản")
    private String accountHolder;
    @NotBlankValidator(field = "Mã OTP")
    @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số")
    private String otp;
}
