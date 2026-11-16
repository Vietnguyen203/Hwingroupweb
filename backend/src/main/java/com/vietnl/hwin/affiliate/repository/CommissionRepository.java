package com.vietnl.hwin.affiliate.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.affiliate.entity.AffiliateEnums.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.Commission;

public interface CommissionRepository extends JpaRepository<Commission, UUID>, JpaSpecificationExecutor<Commission> {

    Optional<Commission> findByOrderId(UUID orderId);

    Page<Commission> findByAffiliateId(UUID affiliateId, Pageable pageable);

    /** Tổng tiền + số đơn theo trạng thái của một CTV: [status, count, sum(amount)]. */
    @Query(value = """
            select status, count(*), coalesce(sum(amount), 0) from affiliate.commission
            where affiliate_id = :affiliateId group by status
            """, nativeQuery = true)
    List<Object[]> summarize(@Param("affiliateId") UUID affiliateId);

    @Query(value = """
            select coalesce(sum(amount), 0) from affiliate.commission
            where affiliate_id = :affiliateId and status = 'APPROVED'
            """, nativeQuery = true)
    long sumApproved(@Param("affiliateId") UUID affiliateId);

    /** Hoa hồng đã tới hạn duyệt (cho job). */
    @Query("select c.id from Commission c where c.status = :status and c.eligibleAt <= :now order by c.eligibleAt")
    List<UUID> findDueIds(@Param("status") CommissionStatus status, @Param("now") Instant now, Pageable pageable);
}
