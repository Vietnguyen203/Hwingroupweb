package com.vietnl.hwin.affiliate.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vietnl.hwin.affiliate.entity.CustomerBinding;

public interface CustomerBindingRepository extends JpaRepository<CustomerBinding, UUID> {

    Optional<CustomerBinding> findByCustomerId(UUID customerId);

    long countByAffiliateId(UUID affiliateId);

    Page<CustomerBinding> findByAffiliateId(UUID affiliateId, Pageable pageable);
}
