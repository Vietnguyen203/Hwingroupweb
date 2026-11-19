package com.vietnl.hwin.affiliate.repository;

import java.time.Instant;
import java.util.UUID;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.affiliate.entity.ReferralClick;

public interface ReferralClickRepository extends JpaRepository<ReferralClick, UUID> {

    long countByAffiliateId(UUID affiliateId);

    long countByAffiliateIdAndClickedAtAfter(UUID affiliateId, Instant after);

    /** Số click mỗi ngày (theo múi giờ {@code zone}) từ {@code since}; chỉ trả những ngày có click, cũ -> mới. */
    @Query(value = """
            select cast(clicked_at at time zone :zone as date) as day, count(*) from affiliate.referral_clicks
            where affiliate_id = :affiliateId and clicked_at >= :since
            group by day order by day
            """, nativeQuery = true)
    List<Object[]> countByDay(@Param("affiliateId") UUID affiliateId, @Param("since") Instant since, @Param("zone") String zone);

    /** Số click theo nền tảng từ {@code since}, nhiều nhất trước. */
    @Query("""
            select c.source, count(c) from ReferralClick c
            where c.affiliateId = :affiliateId and c.clickedAt >= :since
            group by c.source order by count(c) desc
            """)
    List<Object[]> countBySource(@Param("affiliateId") UUID affiliateId, @Param("since") Instant since);
}
