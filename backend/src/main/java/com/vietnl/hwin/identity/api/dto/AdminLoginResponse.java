package com.vietnl.hwin.identity.api.dto;

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
 * Kết quả bước 1 đăng nhập admin. otpRequired=false -> đã đăng nhập (user có dữ liệu);
 * otpRequired=true -> gửi challengeId + OTP tới /api/admin/auth/login/verify.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoginResponse {

    private boolean otpRequired;
    private String challengeId;
    private String sentTo;
    private long expiresInSeconds;
    private MeResponse user;
}
