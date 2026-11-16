package com.vietnl.hwin.affiliate.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.vietnl.hwin.affiliate.entity.Affiliate;

public interface AffiliateRepository extends JpaRepository<Affiliate, UUID>, JpaSpecificationExecutor<Affiliate> {

    Optional<Affiliate> findByUserId(UUID userId);

    Optional<Affiliate> findByReferralCode(String referralCode);

    boolean existsByReferralCode(String referralCode);
}
