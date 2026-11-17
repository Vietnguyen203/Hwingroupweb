package com.vietnl.hwin.ordering.entity;

import java.util.UUID;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Lịch sử chuyển trạng thái – thuộc aggregate Order. */
@Entity
@Table(name = "order_status_histories", schema = "ordering")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderStatusHistory {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus toStatus;

    /** null khi do hệ thống / job thực hiện. */
    private UUID actorId;

    private String note;

    @Column(nullable = false)
    private Instant createdAt;

    OrderStatusHistory(OrderStatus from, OrderStatus to, UUID actorId, String note, Instant at) {
        this.fromStatus = from;
        this.toStatus = to;
        this.actorId = actorId;
        this.note = note;
        this.createdAt = at;
    }
}
