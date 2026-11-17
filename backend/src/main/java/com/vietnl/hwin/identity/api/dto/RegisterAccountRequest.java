package com.vietnl.hwin.identity.api.dto;

import java.time.LocalDate;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.common.validation.NotNullValidator;
import com.vietnl.hwin.common.validation.ValidationPatterns;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Đăng ký tài khoản khách: SĐT hoặc email (đã nhận OTP) + họ tên, ngày sinh (quá khứ), địa chỉ, CCCD, mật khẩu.
 * Mật khẩu kiểm tra theo Password Policy ở backend (PasswordPolicy.validateCustomer).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAccountRequest {

    @Pattern(regexp = ValidationPatterns.PHONE, message = "Số điện thoại không hợp lệ")
    private String phone;
    @Email(message = "Email không hợp lệ")
    @LengthValidator(max = 255, field = "Email")
    private String email;
    @NotBlankValidator(field = "Mã OTP")
    @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số")
    private String otp;
    @NotBlankValidator(field = "Họ tên")
    @LengthValidator(max = 100, field = "Họ tên")
    private String fullName;
    @NotNullValidator(field = "Ngày sinh")
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateOfBirth;
    @NotBlankValidator(field = "Địa chỉ")
    @LengthValidator(max = 255, field = "Địa chỉ")
    private String address;
    @NotBlankValidator(field = "Số CCCD")
    @Pattern(regexp = "^\\d{12}$", message = "Số CCCD gồm đúng 12 chữ số")
    private String citizenId;
    @NotBlankValidator(field = "Mật khẩu")
    @LengthValidator(min = 8, max = 64, field = "Mật khẩu")
    private String password;

    @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
    public boolean isOneContact() {
        return isBlank(phone) != isBlank(email);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
