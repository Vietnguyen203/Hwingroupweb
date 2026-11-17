package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Bước 2 đăng nhập: OTP + "Ghi nhớ đăng nhập 30 ngày". */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyLoginOtpRequest {

    @NotBlankValidator(field = "Mã phiên đăng nhập")
    @LengthValidator(max = 64, field = "Mã phiên đăng nhập")
    private String challengeId;
    @NotBlankValidator(field = "Mã OTP")
    @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số")
    private String otp;
    private boolean rememberDevice;
}
