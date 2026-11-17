package com.vietnl.hwin.identity.service.model;

/**
 * Kết quả đăng nhập khách:
 * - tokens != null: đã đăng nhập (thiết bị được ghi nhớ, hoặc vừa nhập đúng OTP);
 * - ngược lại: cần OTP – dùng challengeId ở bước 2; {@code sentTo} = nơi nhận đã che.
 * {@code trustedDeviceToken}: token "Ghi nhớ đăng nhập" mới cấp (ghi vào cookie), có thể null.
 */
public record LoginResult(IssuedTokens tokens, String challengeId, String sentTo, long expiresInSeconds,
                          String trustedDeviceToken) {

    public static LoginResult loggedIn(IssuedTokens tokens, String trustedDeviceToken) {
        return new LoginResult(tokens, null, null, 0, trustedDeviceToken);
    }

    public static LoginResult otpRequired(String challengeId, String sentTo, long expiresInSeconds) {
        return new LoginResult(null, challengeId, sentTo, expiresInSeconds, null);
    }

    public boolean otpRequired() {
        return tokens == null;
    }
}
