package com.vietnl.hwin.ordering.entity.event;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Admin xác nhận đơn. Để sẵn cho ShippingProvider (tạo vận đơn) sau này. */
@NamedInterface("events")
public record OrderConfirmedEvent(UUID eventId, Instant occurredAt, UUID orderId, String orderCode)
        implements DomainEvent {
}
