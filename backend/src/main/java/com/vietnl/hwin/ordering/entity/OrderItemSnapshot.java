package com.vietnl.hwin.ordering.entity;

import java.util.UUID;

import org.springframework.modulith.NamedInterface;

/** Một dòng hàng trong domain event (giá VND tại thời điểm đặt). */
@NamedInterface("events")
public record OrderItemSnapshot(UUID productId, String productName, int quantity, long unitPrice) {
}
