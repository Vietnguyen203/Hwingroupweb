package com.vietnl.hwin.ordering.entity;

/**
 * Vòng đời đơn: PENDING -> CONFIRMED -> SHIPPING -> DELIVERED -> COMPLETED;
 * CANCELLED (trước SHIPPING); RETURNED (sau DELIVERED, trong hạn đổi trả).
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPING,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    RETURNED
}
