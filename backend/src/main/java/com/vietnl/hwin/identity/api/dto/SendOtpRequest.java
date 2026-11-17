package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.ValidationPatterns;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Gửi OTP xác minh khi ĐĂNG KÝ: nhập SĐT (OTP qua SMS) HOẶC email (OTP qua email). Tài khoản phải chưa có. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendOtpRequest {

    @Pattern(regexp = ValidationPatterns.PHONE, message = "Số điện thoại không hợp lệ")
    private String phone;
    @Email(message = "Email không hợp lệ")
    @LengthValidator(max = 255, field = "Email")
    private String email;

    @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
    public boolean isOneContact() {
        return isBlank(phone) != isBlank(email);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
