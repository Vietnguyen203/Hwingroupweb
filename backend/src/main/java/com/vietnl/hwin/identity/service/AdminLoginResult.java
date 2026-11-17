package com.vietnl.hwin.identity.service;

/**
 * Kết quả bước 1 đăng nhập admin:
 * - tokens != null: đã đăng nhập (chỉ tài khoản dev miễn OTP);
 * - ngược lại: cần OTP – dùng challengeId + mã OTP ở bước 2. {@code sentTo}: email / SĐT nhận OTP (đã che).
 */
public record AdminLoginResult(IssuedTokens tokens, String challengeId, String sentTo, long expiresInSeconds) {

    public static AdminLoginResult loggedIn(IssuedTokens tokens) {
        return new AdminLoginResult(tokens, null, null, 0);
    }

    public static AdminLoginResult otpRequired(String challengeId, String sentTo, long expiresInSeconds) {
        return new AdminLoginResult(null, challengeId, sentTo, expiresInSeconds);
    }

    public boolean otpRequired() {
        return tokens == null;
    }
}
