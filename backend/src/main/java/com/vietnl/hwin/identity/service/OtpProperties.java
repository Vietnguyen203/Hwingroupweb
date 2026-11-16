package com.vietnl.hwin.identity.service;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Cấu hình OTP – prefix hwin.otp. */
@Validated
@ConfigurationProperties(prefix = "hwin.otp")
public record OtpProperties(
        Duration ttl,
        int maxAttempts,
        Duration lockDuration,
        int sendLimit,
        Duration sendWindow,
        @NotBlank String pepper,
        boolean logCode) {
}
