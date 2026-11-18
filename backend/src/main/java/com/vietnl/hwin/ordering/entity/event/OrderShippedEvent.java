package com.vietnl.hwin.ordering.entity.event;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Đơn đã giao cho đơn vị vận chuyển (SHIPPING). Nghe bởi: thông báo cho khách. */
@NamedInterface("events")
public record OrderShippedEvent(UUID eventId, Instant occurredAt, UUID orderId, String orderCode, UUID customerId)
        implements DomainEvent {
}
