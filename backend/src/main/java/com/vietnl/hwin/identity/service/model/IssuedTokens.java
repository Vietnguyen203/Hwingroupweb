package com.vietnl.hwin.identity.service.model;

import java.util.UUID;

/** Cặp token vừa cấp, controller ghi ra cookie. */
public record IssuedTokens(UUID userId, String accessToken, String refreshToken) {
}
