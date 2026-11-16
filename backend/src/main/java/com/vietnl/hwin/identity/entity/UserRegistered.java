package com.vietnl.hwin.identity.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/**
 * Phát khi một tài khoản khách mới được tạo (đăng nhập OTP lần đầu).
 * Module customer nghe để tạo hồ sơ Customer (id = userId).
 */
@NamedInterface("events")
public record UserRegistered(UUID eventId, Instant occurredAt, UUID userId, String phone) implements DomainEvent {

    public static UserRegistered of(UUID userId, String phone, Instant now) {
        return new UserRegistered(UUID.randomUUID(), now, userId, phone);
    }
}
