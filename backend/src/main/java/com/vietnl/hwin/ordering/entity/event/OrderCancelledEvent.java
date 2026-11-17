package com.vietnl.hwin.ordering.entity.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Đơn bị hủy (trước khi giao). Nghe bởi: ordering (hoàn kho), customer (trừ thống kê), affiliate (hủy hoa hồng). */
@NamedInterface("events")
public record OrderCancelledEvent(UUID eventId, Instant occurredAt, UUID orderId, String orderCode, UUID customerId,
                             List<OrderItemSnapshot> items, long total, String reason) implements DomainEvent {
}
