package com.vietnl.hwin.identity.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import org.hibernate.annotations.CreationTimestamp;

import com.vietnl.hwin.common.exception.DomainException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: refresh token (chỉ lưu hash SHA-256, không lưu token gốc).
 * Các token xoay vòng từ cùng một lần đăng nhập chung {@code familyId}:
 * nếu token đã bị thu hồi mà vẫn được dùng lại -> nghi bị đánh cắp -> thu hồi cả family.
 */
@Entity
@Table(name = "refresh_token", schema = "identity")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @Column(nullable = false)
    private UUID familyId;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant revokedAt;

    private UUID replacedById;

    private String userAgent;

    private String ipHash;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static RefreshToken issue(UUID userId, String tokenHash, UUID familyId, Instant expiresAt,
                                     String userAgent, String ipHash) {
        RefreshToken t = new RefreshToken();
        t.userId = userId;
        t.tokenHash = tokenHash;
        t.familyId = familyId;
        t.expiresAt = expiresAt;
        t.userAgent = userAgent;
        t.ipHash = ipHash;
        return t;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    /** Đánh dấu đã được thay bằng token mới (xoay vòng). */
    public void rotatedTo(UUID newTokenId, Instant now) {
        if (isRevoked()) {
            throw new DomainException("REFRESH_REVOKED", "Refresh token đã bị thu hồi");
        }
        this.replacedById = newTokenId;
        this.revokedAt = now;
    }

    public void revoke(Instant now) {
        if (!isRevoked()) {
            this.revokedAt = now;
        }
    }
}
