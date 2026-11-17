package com.vietnl.hwin.affiliate.entity.event;

import java.time.Instant;
import java.util.UUID;

import com.vietnl.hwin.common.domain.DomainEvent;

/** CTV bị tạm khóa -> gỡ vai trò AFFILIATE, link ngừng hoạt động. */
public record AffiliateSuspendedEvent(UUID eventId, Instant occurredAt, UUID affiliateId, UUID userId)
        implements DomainEvent {
}
