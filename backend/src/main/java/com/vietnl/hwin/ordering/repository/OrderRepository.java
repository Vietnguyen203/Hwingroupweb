package com.vietnl.hwin.ordering.repository;

import java.util.UUID;

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

public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    /** Luôn lọc theo customerId để chống xem đơn của người khác (IDOR). */
    Optional<Order> findByOrderCodeAndCustomerId(String orderCode, UUID customerId);

    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Order> findByCustomerIdAndStatus(UUID customerId, OrderStatus status, Pageable pageable);

    boolean existsByOrderCode(String orderCode);

    /** Đơn chuyển khoản còn chờ, chưa nhận tiền, đặt trước thời điểm cutoff – để job hủy quá hạn. */
    @Query("select o.id from Order o where o.status = com.vietnl.hwin.ordering.entity.OrderStatus.PENDING "
            + "and o.paymentMethod = com.vietnl.hwin.ordering.entity.PaymentMethod.BANK_QR "
            + "and o.paymentStatus = com.vietnl.hwin.ordering.entity.PaymentStatus.UNPAID "
            + "and o.placedAt < :cutoff order by o.placedAt")
    List<UUID> findUnpaidBankQrBefore(@Param("cutoff") Instant cutoff, Pageable pageable);

    /** Đơn đã giao quá hạn đổi trả – để job chuyển COMPLETED. */
    @Query("select o.id from Order o where o.status = com.vietnl.hwin.ordering.entity.OrderStatus.DELIVERED "
            + "and o.deliveredAt < :cutoff")
    List<UUID> findDeliveredBefore(@Param("cutoff") Instant cutoff, Pageable pageable);
}
