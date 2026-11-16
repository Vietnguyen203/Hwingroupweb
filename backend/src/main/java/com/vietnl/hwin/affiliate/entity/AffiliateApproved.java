package com.vietnl.hwin.affiliate.entity;

import java.time.Instant;
import java.util.UUID;

import com.vietnl.hwin.common.domain.DomainEvent;

/** CTV được duyệt (hoặc mở khóa lại) -> cấp vai trò AFFILIATE cho tài khoản. */
public record AffiliateApproved(UUID eventId, Instant occurredAt, UUID affiliateId, UUID userId, String referralCode)
        implements DomainEvent {
}
