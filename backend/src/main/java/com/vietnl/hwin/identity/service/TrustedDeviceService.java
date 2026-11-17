package com.vietnl.hwin.identity.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.identity.service.config.IdentityProperties;

/**
 * "Ghi nhớ đăng nhập": thiết bị đã nhập đúng OTP được tin cậy trong 30 ngày – đăng nhập lại chỉ cần mật khẩu.
 * Token ngẫu nhiên nằm trong cookie HttpOnly hwin_td; Redis chỉ lưu SHA-256 của token -> userId (TTL 30 ngày).
 */
@Service
public class TrustedDeviceService {

    private static final String PREFIX = "trusted-device:";

    private final StringRedisTemplate redis;
    private final IdentityProperties props;

    public TrustedDeviceService(StringRedisTemplate redis, IdentityProperties props) {
        this.redis = redis;
        this.props = props;
    }

    /** @return token gốc để ghi cookie */
    public String remember(UUID userId) {
        String token = Hashing.randomToken(32);
        redis.opsForValue().set(PREFIX + Hashing.sha256Hex(token), userId.toString(), props.trustedDeviceTtl());
        return token;
    }

    /** Thiết bị (token trong cookie) có đang được tin cậy cho đúng tài khoản này không. */
    public boolean isTrusted(String token, UUID userId) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return Optional.ofNullable(redis.opsForValue().get(PREFIX + Hashing.sha256Hex(token)))
                .map(userId.toString()::equals)
                .orElse(false);
    }

    public long ttlSeconds() {
        return props.trustedDeviceTtl().toSeconds();
    }
}
