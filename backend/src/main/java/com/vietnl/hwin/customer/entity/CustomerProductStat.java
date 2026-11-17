package com.vietnl.hwin.customer.entity;

import java.util.UUID;

import java.io.Serializable;
import java.time.Instant;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Read model: khách đã mua sản phẩm nào, bao nhiêu – phục vụ "Sản phẩm bạn hay mua". */
@Entity
@Table(name = "customer_product_stats", schema = "customer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerProductStat {

    @EmbeddedId
    private CustomerProductStatId id;

    private int totalQuantity;

    private int orderCount;

    private Instant lastOrderedAt;

    public static CustomerProductStat start(UUID customerId, UUID productId) {
        CustomerProductStat s = new CustomerProductStat();
        s.id = new CustomerProductStatId(customerId, productId);
        return s;
    }

    public void add(int quantity, Instant at) {
        totalQuantity += quantity;
        orderCount++;
        if (lastOrderedAt == null || at.isAfter(lastOrderedAt)) {
            lastOrderedAt = at;
        }
    }

    public void subtract(int quantity) {
        totalQuantity = Math.max(0, totalQuantity - quantity);
        orderCount = Math.max(0, orderCount - 1);
    }

}
