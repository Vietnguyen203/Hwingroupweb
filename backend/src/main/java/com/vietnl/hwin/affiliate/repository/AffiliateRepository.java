package com.vietnl.hwin.affiliate.repository;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import com.vietnl.hwin.affiliate.entity.AffiliateStatus;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.vietnl.hwin.affiliate.entity.Affiliate;

public interface AffiliateRepository extends JpaRepository<Affiliate, UUID>, JpaSpecificationExecutor<Affiliate> {

    Optional<Affiliate> findByUserId(UUID userId);

    Optional<Affiliate> findByReferralCode(String referralCode);

    boolean existsByReferralCode(String referralCode);

    /** Hồ sơ bị từ chối từ trước mốc {@code cutoff} mà còn giữ ảnh CCCD. */
    List<Affiliate> findByStatusAndReviewedAtBeforeAndIdCardFrontKeyIsNotNull(AffiliateStatus status, Instant cutoff);

    /** Mọi khóa ảnh CCCD đang được hồ sơ tham chiếu (mặt trước + mặt sau). */
    @Query("select a.idCardFrontKey from Affiliate a where a.idCardFrontKey is not null")
    List<String> allFrontKeys();

    @Query("select a.idCardBackKey from Affiliate a where a.idCardBackKey is not null")
    List<String> allBackKeys();

    boolean existsByIdCardFrontKeyOrIdCardBackKey(String frontKey, String backKey);
}
