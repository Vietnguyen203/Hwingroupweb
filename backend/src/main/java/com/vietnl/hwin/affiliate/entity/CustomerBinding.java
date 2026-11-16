package com.vietnl.hwin.affiliate.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: gắn khách VĨNH VIỄN với CTV (first-touch). Tạo ở đơn đầu tiên có ref hợp lệ;
 * customer_id UNIQUE nên không bao giờ đổi sang CTV khác, kể cả khi khách mở link CTV khác sau này.
 */
@Entity
@Table(name = "customer_binding", schema = "affiliate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerBinding {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID customerId;

    @Column(nullable = false)
    private UUID affiliateId;

    @Column(nullable = false)
    private UUID firstOrderId;

    @Column(nullable = false)
    private String referralCode;

    @Column(nullable = false)
    private Instant boundAt;

    public static CustomerBinding bind(UUID customerId, Affiliate affiliate, UUID firstOrderId, Instant now) {
        CustomerBinding b = new CustomerBinding();
        b.customerId = customerId;
        b.affiliateId = affiliate.getId();
        b.referralCode = affiliate.getReferralCode();
        b.firstOrderId = firstOrderId;
        b.boundAt = now;
        return b;
    }
}
