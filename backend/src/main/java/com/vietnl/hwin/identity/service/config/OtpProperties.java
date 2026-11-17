package com.vietnl.hwin.identity.service.config;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Cấu hình OTP – prefix hwin.otp.
 * sendLimit: số lần gửi / sendWindow theo SĐT; ipSendLimit: theo IP (dev nới rộng để chạy Postman nhiều lần).
 */
@Validated
@ConfigurationProperties(prefix = "hwin.otp")
public record OtpProperties(
        Duration ttl,
        int maxAttempts,
        Duration lockDuration,
        int sendLimit,
        int ipSendLimit,
        Duration sendWindow,
        @NotBlank String pepper,
        boolean logCode) {
}
