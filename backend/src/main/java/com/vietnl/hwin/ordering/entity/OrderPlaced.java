package com.vietnl.hwin.ordering.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/**
 * Đơn vừa được đặt (PENDING). Nghe bởi: ordering (trừ kho, xóa giỏ), customer (thống kê), affiliate (hoa hồng).
 */
@NamedInterface("events")
public record OrderPlaced(UUID eventId, Instant occurredAt, Long orderId, String orderCode, Long customerId,
                          String referralCode, List<OrderItemSnapshot> items, long subtotal, long discount,
                          long shippingFee, long total) implements DomainEvent {
}
