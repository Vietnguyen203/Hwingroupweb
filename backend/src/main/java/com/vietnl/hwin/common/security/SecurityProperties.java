package com.vietnl.hwin.common.security;

import java.time.Duration;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Cấu hình bảo mật – prefix hwin.security. */
@Validated
@ConfigurationProperties(prefix = "hwin.security")
public record SecurityProperties(
        @NotBlank @Size(min = 32, message = "JWT_SECRET phải dài tối thiểu 32 ký tự") String jwtSecret,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        boolean cookieSecure,
        List<String> corsOrigins,
        List<String> corsOriginPatterns) {

    /** Mẫu origin (có ký tự *) – chỉ đặt ở dev để mở web qua IP mạng LAN; để trống thì không áp dụng. */
    public List<String> corsOriginPatterns() {
        return corsOriginPatterns == null ? List.of() : corsOriginPatterns;
    }
}
