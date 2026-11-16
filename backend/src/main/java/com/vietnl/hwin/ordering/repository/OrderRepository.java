package com.vietnl.hwin.ordering.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    /** Luôn lọc theo customerId để chống xem đơn của người khác (IDOR). */
    Optional<Order> findByOrderCodeAndCustomerId(String orderCode, Long customerId);

    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    Page<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status, Pageable pageable);

    boolean existsByOrderCode(String orderCode);

    /** Đơn đã giao quá hạn đổi trả – để job chuyển COMPLETED. */
    @Query("select o.id from Order o where o.status = com.vietnl.hwin.ordering.entity.OrderStatus.DELIVERED "
            + "and o.deliveredAt < :cutoff")
    List<Long> findDeliveredBefore(@Param("cutoff") Instant cutoff, Pageable pageable);
}
