package com.vietnl.hwin.identity.service;

/**
 * Kết quả bước 1 đăng nhập admin:
 * - tokens != null: đã đăng nhập (chỉ tài khoản dev miễn OTP);
 * - ngược lại: cần OTP – dùng challengeId + mã OTP ở bước 2.
 */
public record AdminLoginResult(IssuedTokens tokens, String challengeId, String phoneMasked, long expiresInSeconds) {

    public static AdminLoginResult loggedIn(IssuedTokens tokens) {
        return new AdminLoginResult(tokens, null, null, 0);
    }

    public static AdminLoginResult otpRequired(String challengeId, String phoneMasked, long expiresInSeconds) {
        return new AdminLoginResult(null, challengeId, phoneMasked, expiresInSeconds);
    }

    public boolean otpRequired() {
        return tokens == null;
    }
}
