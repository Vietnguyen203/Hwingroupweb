package com.vietnl.hwin.identity.api.requests;

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

/**
 * Tạo tài khoản quản trị – bắt buộc mật khẩu mạnh và nơi nhận OTP:
 * {@code email} là email thật (OTP gửi qua email), hoặc có {@code phone}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdminRequest {

    @NotBlankValidator(field = "Email")
    @LengthValidator(max = 255, field = "Email")
    private String email;
    @NotBlankValidator(field = "Mật khẩu")
    @LengthValidator(max = 100, field = "Mật khẩu")
    private String password;
    @LengthValidator(max = 100, field = "Họ tên")
    private String fullName;
    @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ")
    private String phone;
}
