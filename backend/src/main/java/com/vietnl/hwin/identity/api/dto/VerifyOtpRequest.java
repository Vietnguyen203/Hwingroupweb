package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ")
    private String phone;
    @Email(message = "Email không hợp lệ")
    @LengthValidator(max = 255, field = "Email")
    private String email;
    @NotBlankValidator(field = "Mã OTP")
    @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số")
    private String otp;

    @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
    public boolean isOneContact() {
    return isBlank(phone) != isBlank(email);
    }

    private static boolean isBlank(String s) {
    return s == null || s.isBlank();
    }
}
