package com.vietnl.hwin.customer.repository;

import com.vietnl.hwin.customer.entity.CustomerProductStatId;
import java.util.UUID;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.customer.entity.CustomerProductStat;

/** Repository của read model "sản phẩm hay mua". */
public interface CustomerProductStatRepository extends JpaRepository<CustomerProductStat, CustomerProductStatId> {

    @Query("select s from CustomerProductStat s where s.id.customerId = :customerId and s.totalQuantity > 0 "
            + "order by s.totalQuantity desc, s.lastOrderedAt desc")
    List<CustomerProductStat> findTop(@Param("customerId") UUID customerId, Pageable pageable);
}
