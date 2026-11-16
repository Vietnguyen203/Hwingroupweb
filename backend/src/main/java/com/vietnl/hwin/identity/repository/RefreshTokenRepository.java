package com.vietnl.hwin.identity.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.identity.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Xóa token hết hạn hoặc đã thu hồi trước thời điểm cutoff. @return số dòng xóa */
    @Modifying
    @Query("delete from RefreshToken t where t.expiresAt < :cutoff or (t.revokedAt is not null and t.revokedAt < :cutoff)")
    int deleteStale(@Param("cutoff") Instant cutoff);

    /** Thu hồi toàn bộ token cùng family (khi phát hiện token cũ bị dùng lại). */
    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);
}
