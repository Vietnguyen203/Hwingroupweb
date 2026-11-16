package com.vietnl.hwin.affiliate.repository;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vietnl.hwin.affiliate.entity.ReferralClick;

public interface ReferralClickRepository extends JpaRepository<ReferralClick, UUID> {

    long countByAffiliateId(UUID affiliateId);

    long countByAffiliateIdAndClickedAtAfter(UUID affiliateId, Instant after);
}
