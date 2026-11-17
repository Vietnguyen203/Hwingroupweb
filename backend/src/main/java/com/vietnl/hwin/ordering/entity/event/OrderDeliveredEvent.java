package com.vietnl.hwin.ordering.entity.event;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Giao thành công. Affiliate dùng {@code deliveredAt} để tính thời điểm duyệt hoa hồng (+7 ngày). */
@NamedInterface("events")
public record OrderDeliveredEvent(UUID eventId, Instant occurredAt, UUID orderId, String orderCode, Instant deliveredAt)
        implements DomainEvent {
}
