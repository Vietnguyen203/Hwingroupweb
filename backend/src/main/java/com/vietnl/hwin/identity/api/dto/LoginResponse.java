package com.vietnl.hwin.identity.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Kết quả bước 1 đăng nhập: otpRequired=false -> đã đăng nhập (user có dữ liệu); true -> gửi challengeId + OTP. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private boolean otpRequired;
    private String challengeId;
    private String sentTo;
    private long expiresInSeconds;
    private MeResponse user;
}
