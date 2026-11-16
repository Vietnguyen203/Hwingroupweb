package com.vietnl.hwin.identity.service;

/** Cặp token vừa cấp, controller ghi ra cookie. */
public record IssuedTokens(Long userId, String accessToken, String refreshToken) {
}
