package com.vietnl.hwin.identity.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.DomainEvent;

/**
 * Phát khi một tài khoản khách mới được tạo (đăng nhập OTP lần đầu, bằng SĐT hoặc email).
 * Module customer nghe để tạo hồ sơ Customer (id = userId).
 * {@code phone} (+84...) và {@code email} có thể null, nhưng không đồng thời null.
 */
@NamedInterface("events")
public record UserRegistered(UUID eventId, Instant occurredAt, UUID userId, String phone, String email)
        implements DomainEvent {

    public static UserRegistered of(UUID userId, String phone, String email, Instant now) {
        return new UserRegistered(UUID.randomUUID(), now, userId, phone, email);
    }
}
