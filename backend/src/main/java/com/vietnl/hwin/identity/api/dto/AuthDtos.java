package com.vietnl.hwin.identity.api.dto;

import java.util.UUID;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO của API xác thực. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record OtpRequest(
            @NotBlank(message = "Vui lòng nhập số điện thoại")
            @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ")
            String phone) {
    }

    public record OtpSentResponse(long expiresInSeconds) {
    }

    public record OtpVerifyRequest(
            @NotBlank @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp) {
    }

    /** {@code email}: email hoặc tên đăng nhập của admin (ví dụ "admin"). */
    public record AdminLoginRequest(
            @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 100) String password) {
    }

    /** Thông tin người dùng hiện tại. SĐT luôn được che. */
    public record MeResponse(UUID id, String phoneMasked, String email, String fullName, Set<String> roles) {
    }
}
