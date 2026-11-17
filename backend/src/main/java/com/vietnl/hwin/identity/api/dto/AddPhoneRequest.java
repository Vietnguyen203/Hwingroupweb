package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.common.validation.ValidationPatterns;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thêm SĐT bước 2: SĐT + OTP. Xong thì SĐT dùng được làm tên đăng nhập. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddPhoneRequest {

    @NotBlankValidator(field = "Số điện thoại")
    @Pattern(regexp = ValidationPatterns.PHONE, message = "Số điện thoại không hợp lệ")
    private String phone;
    @NotBlankValidator(field = "Mã OTP")
    @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số")
    private String otp;
}
