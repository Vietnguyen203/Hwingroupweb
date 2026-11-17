package com.vietnl.hwin.identity.entity.event;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/** Tài khoản (đăng ký bằng email) vừa thêm SĐT đã xác minh OTP – SĐT này dùng được làm tên đăng nhập. */
@NamedInterface("events")
public record UserPhoneAddedEvent(UUID eventId, Instant occurredAt, UUID userId, String phone) implements DomainEvent {

    public static UserPhoneAddedEvent of(UUID userId, String phone, Instant now) {
        return new UserPhoneAddedEvent(UUID.randomUUID(), now, userId, phone);
    }
}
