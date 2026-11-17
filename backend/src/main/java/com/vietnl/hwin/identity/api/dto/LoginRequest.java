package com.vietnl.hwin.identity.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Đăng nhập khách / CTV: tên đăng nhập là email HOẶC SĐT + mật khẩu. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlankValidator(field = "Email / số điện thoại")
    @LengthValidator(max = 255, field = "Email / số điện thoại")
    private String identifier;
    @NotBlankValidator(field = "Mật khẩu")
    @LengthValidator(max = 64, field = "Mật khẩu")
    private String password;
}
