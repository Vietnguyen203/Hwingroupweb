package com.vietnl.hwin.identity.api.dto;

import java.util.UUID;

import java.util.Set;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO của API xác thực. */
public final class AuthDtos {

    private AuthDtos() {
    }

    /**
     * Gửi OTP: nhập SĐT (OTP qua SMS) HOẶC email (OTP qua email).
     * {@code purpose}: LOGIN (mặc định – tài khoản phải có sẵn) | REGISTER (tài khoản phải chưa có).
     */
    public record OtpRequest(
            @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone,
            @Email(message = "Email không hợp lệ") @Size(max = 255) String email,
            @Pattern(regexp = "LOGIN|REGISTER", message = "purpose phải là LOGIN hoặc REGISTER") String purpose) {

        public boolean register() {
            return "REGISTER".equals(purpose);
        }

        @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
        public boolean isOneContact() {
            return isBlank(phone) != isBlank(email);
        }
    }

    /** @param channel SMS | EMAIL; @param sentTo nơi nhận đã che */
    public record OtpSentResponse(String channel, String sentTo, long expiresInSeconds) {
    }

    public record OtpVerifyRequest(
            @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone,
            @Email(message = "Email không hợp lệ") @Size(max = 255) String email,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp) {

        @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
        public boolean isOneContact() {
            return isBlank(phone) != isBlank(email);
        }
    }

    /** Đăng ký: SĐT hoặc email + OTP (purpose REGISTER) + họ tên. */
    public record RegisterRequest(
            @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone,
            @Email(message = "Email không hợp lệ") @Size(max = 255) String email,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp,
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100) String fullName) {

        @AssertTrue(message = "Nhập số điện thoại hoặc email (chỉ một trong hai)")
        public boolean isOneContact() {
            return isBlank(phone) != isBlank(email);
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
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
    public record AdminLoginResponse(boolean otpRequired, String challengeId, String sentTo,
                                     long expiresInSeconds, MeResponse user) {
    }

    public record AdminOtpVerifyRequest(
            @NotBlank @Size(max = 64) String challengeId,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "OTP gồm 6 chữ số") String otp) {
    }

    /**
     * Tạo tài khoản quản trị – bắt buộc mật khẩu mạnh và nơi nhận OTP:
     * {@code email} là email thật (OTP gửi qua email), hoặc có {@code phone}.
     */
    public record CreateAdminRequest(
            @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 100) String password,
            @Size(max = 100) String fullName,
            @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String phone) {
    }

    /** Thông tin người dùng hiện tại. SĐT luôn được che. */
    public record MeResponse(UUID id, String phoneMasked, String email, String fullName, Set<String> roles) {
    }
}
