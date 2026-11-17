package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.common.validation.ValidationPatterns;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thêm SĐT cho tài khoản đăng ký bằng email: bước 1 gửi OTP tới SĐT. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendPhoneOtpRequest {

    @NotBlankValidator(field = "Số điện thoại")
    @Pattern(regexp = ValidationPatterns.PHONE, message = "Số điện thoại không hợp lệ")
    private String phone;
}
