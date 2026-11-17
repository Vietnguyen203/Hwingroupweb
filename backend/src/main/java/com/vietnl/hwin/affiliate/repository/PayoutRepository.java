package com.vietnl.hwin.affiliate.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.affiliate.entity.PayoutStatus;
import com.vietnl.hwin.affiliate.entity.Payout;

public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    Page<Payout> findByAffiliateId(UUID affiliateId, Pageable pageable);

    Page<Payout> findByStatus(PayoutStatus status, Pageable pageable);

    boolean existsByAffiliateIdAndStatusIn(UUID affiliateId, Collection<PayoutStatus> statuses);

    /** Tổng tiền đã rút / đang chờ rút (mọi trạng thái trừ REJECTED). */
    @Query(value = """
            select coalesce(sum(amount), 0) from affiliate.payouts
            where affiliate_id = :affiliateId and status in ('REQUESTED', 'APPROVED', 'PAID')
            """, nativeQuery = true)
    long sumNotRejected(@Param("affiliateId") UUID affiliateId);

    @Query(value = """
            select coalesce(sum(amount), 0) from affiliate.payouts where affiliate_id = :affiliateId and status = 'PAID'
            """, nativeQuery = true)
    long sumPaid(@Param("affiliateId") UUID affiliateId);
}
