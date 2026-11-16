package com.vietnl.hwin.customer.entity;

import java.util.UUID;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.vietnl.hwin.common.domain.Money;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Read model: thống kê mua hàng của khách, cập nhật bởi event của ordering.
 * Không tính đơn đã hủy / trả hàng.
 */
@Entity
@Table(name = "customer_stats", schema = "customer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerStats {

    @Id
    private UUID customerId;

    private int totalOrders;

    @Column(nullable = false)
    private Money totalSpent = Money.ZERO;

    private Instant firstOrderAt;

    private Instant lastOrderAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public static CustomerStats empty(UUID customerId, Instant now) {
        CustomerStats s = new CustomerStats();
        s.customerId = customerId;
        s.updatedAt = now;
        return s;
    }

    public void onOrderPlaced(long total, Instant placedAt) {
        totalOrders++;
        totalSpent = totalSpent.plus(Money.of(total));
        if (firstOrderAt == null || placedAt.isBefore(firstOrderAt)) {
            firstOrderAt = placedAt;
        }
        if (lastOrderAt == null || placedAt.isAfter(lastOrderAt)) {
            lastOrderAt = placedAt;
        }
        updatedAt = placedAt;
    }

    /** Đơn bị hủy / trả hàng: trừ lại (không để âm). */
    public void onOrderVoided(long total, Instant at) {
        totalOrders = Math.max(0, totalOrders - 1);
        totalSpent = totalSpent.amount() >= total ? totalSpent.minus(Money.of(total)) : Money.ZERO;
        updatedAt = at;
    }
}
