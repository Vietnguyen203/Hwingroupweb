package com.vietnl.hwin.affiliate.entity.event;

import java.time.Instant;
import java.util.UUID;

import com.vietnl.hwin.common.domain.DomainEvent;

/** CTV được duyệt (hoặc mở khóa lại) -> cấp vai trò AFFILIATE cho tài khoản. */
public record AffiliateApprovedEvent(UUID eventId, Instant occurredAt, UUID affiliateId, UUID userId, String referralCode)
        implements DomainEvent {
}
