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

/** {@code email}: email hoặc tên đăng nhập của admin (ví dụ "admin"). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoginRequest {

    @NotBlankValidator(field = "Email")
    @LengthValidator(max = 255, field = "Email")
    private String email;
    @NotBlankValidator(field = "Mật khẩu")
    @LengthValidator(max = 100, field = "Mật khẩu")
    private String password;
}
