package com.vietnl.hwin.common.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Base cho mọi domain event. Event là record bất biến, chỉ chứa ID và giá trị snapshot.
 * {@code eventId} dùng để listener xử lý idempotent.
 */
public interface DomainEvent {

    UUID eventId();

    Instant occurredAt();
}
