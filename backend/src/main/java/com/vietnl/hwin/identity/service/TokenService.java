package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.service.model.IssuedTokens;
import com.vietnl.hwin.identity.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.security.JwtService;
import com.vietnl.hwin.common.security.SecurityProperties;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.RefreshToken;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.RefreshTokenRepository;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Cấp access token (JWT 15 phút) + refresh token (7 ngày, xoay vòng, lưu hash trong DB).
 */
@Service
public class TokenService {

    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokens;
    private final UserAccountRepository users;
    private final SecurityProperties props;
    private final Clock clock;

    public TokenService(JwtService jwtService, RefreshTokenRepository refreshTokens, UserAccountRepository users,
                        SecurityProperties props, Clock clock) {
        this.jwtService = jwtService;
        this.refreshTokens = refreshTokens;
        this.users = users;
        this.props = props;
        this.clock = clock;
    }

    /** Đăng nhập mới -> family mới. */
    @Transactional
    public IssuedTokens issue(UserAccount user, ClientInfo client) {
        Instant now = clock.instant();
        String raw = Hashing.randomToken(32);
        refreshTokens.save(RefreshToken.issue(user.getId(), Hashing.sha256Hex(raw), UUID.randomUUID(),
                now.plus(props.refreshTokenTtl()), client.userAgent(), client.ipHash()));
        return new IssuedTokens(user.getId(), accessToken(user, now), raw);
    }

    /**
     * Xoay vòng: token cũ bị thu hồi, cấp token mới cùng family.
     * Token đã thu hồi mà bị dùng lại -> thu hồi cả family (nghi bị đánh cắp).
     */
    @Transactional(noRollbackFor = ResponseException.class)
    public IssuedTokens rotate(String rawRefreshToken, ClientInfo client) {
        Instant now = clock.instant();
        RefreshToken current = refreshTokens.findByTokenHash(Hashing.sha256Hex(rawRefreshToken))
                .orElseThrow(() -> new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.REFRESH_INVALID));
        if (current.isRevoked()) {
            refreshTokens.revokeFamily(current.getFamilyId(), now);
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.REFRESH_REUSED);
        }
        if (current.isExpired(now)) {
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.REFRESH_EXPIRED);
        }
        UserAccount user = users.findById(current.getUserId())
                .orElseThrow(() -> new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.REFRESH_INVALID));
        user.ensureActive();

        String raw = Hashing.randomToken(32);
        RefreshToken next = refreshTokens.save(RefreshToken.issue(user.getId(), Hashing.sha256Hex(raw),
                current.getFamilyId(), now.plus(props.refreshTokenTtl()), client.userAgent(), client.ipHash()));
        current.rotatedTo(next.getId(), now);
        return new IssuedTokens(user.getId(), accessToken(user, now), raw);
    }

    /** Đăng xuất: thu hồi token hiện tại (không lỗi nếu token không tồn tại). */
    @Transactional
    public void revoke(String rawRefreshToken) {
        refreshTokens.findByTokenHash(Hashing.sha256Hex(rawRefreshToken))
                .ifPresent(t -> t.revoke(clock.instant()));
    }

    private String accessToken(UserAccount user, Instant now) {
        return jwtService.issueAccessToken(user.getId(),
                user.getRoles().stream().map(Enum::name).toList(), now);
    }
}
