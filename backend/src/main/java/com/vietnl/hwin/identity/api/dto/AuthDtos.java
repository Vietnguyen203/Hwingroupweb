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

    /**
     * Kết quả bước 1 đăng nhập admin. otpRequired=false -> đã đăng nhập (user có dữ liệu);
     * otpRequired=true -> gửi challengeId + OTP tới /api/admin/auth/login/verify.
     */
    public record AdminLoginResponse(boolean otpRequired, String challengeId, String phoneMasked,
                                     long expiresInSeconds, MeResponse user) {
    }

    public record AdminOtpVerifyRequest(
            @NotBlank @Size(max = 64) String challengeId,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp) {
    }

    /** Tạo tài khoản quản trị – mật khẩu mạnh + SĐT nhận OTP là bắt buộc. */
    public record CreateAdminRequest(
            @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 100) String password,
            @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone) {
    }

    /** Thông tin người dùng hiện tại. SĐT luôn được che. */
    public record MeResponse(UUID id, String phoneMasked, String email, String fullName, Set<String> roles) {
    }
}
