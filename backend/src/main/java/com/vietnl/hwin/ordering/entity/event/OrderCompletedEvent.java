package com.vietnl.hwin.ordering.entity.event;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Hết hạn đổi trả – đơn hoàn tất (job tự chuyển). */
@NamedInterface("events")
public record OrderCompletedEvent(UUID eventId, Instant occurredAt, UUID orderId, String orderCode)
        implements DomainEvent {
}
