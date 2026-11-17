package com.vietnl.hwin.identity.service.config;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Cấu hình tài khoản khách – prefix hwin.identity.
 *
 * @param piiEncryptionKey  khóa AES 32 byte (base64) mã hóa CCCD – biến IDENTITY_PII_KEY
 * @param trustedDeviceTtl  "Ghi nhớ đăng nhập": thời gian thiết bị không phải nhập OTP lại (mặc định 30 ngày)
 * @param loginFailLimit    số lần sai mật khẩu tối đa trong loginFailWindow (theo IP và theo tài khoản)
 * @param loginFailWindow   cửa sổ đếm lần sai / thời gian khóa
 */
@Validated
@ConfigurationProperties(prefix = "hwin.identity")
public record IdentityProperties(
        @NotBlank String piiEncryptionKey,
        Duration trustedDeviceTtl,
        int loginFailLimit,
        Duration loginFailWindow) {

    public IdentityProperties {
        trustedDeviceTtl = trustedDeviceTtl == null ? Duration.ofDays(30) : trustedDeviceTtl;
        loginFailLimit = loginFailLimit <= 0 ? 5 : loginFailLimit;
        loginFailWindow = loginFailWindow == null ? Duration.ofMinutes(15) : loginFailWindow;
    }
}
