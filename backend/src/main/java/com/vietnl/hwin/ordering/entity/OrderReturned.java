package com.vietnl.hwin.ordering.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Khách trả hàng sau khi giao (trong hạn đổi trả). Xử lý như OrderCancelled. */
@NamedInterface("events")
public record OrderReturned(UUID eventId, Instant occurredAt, Long orderId, String orderCode, Long customerId,
                            List<OrderItemSnapshot> items, long total) implements DomainEvent {
}
