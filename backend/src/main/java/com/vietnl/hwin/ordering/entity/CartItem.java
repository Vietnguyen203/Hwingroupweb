package com.vietnl.hwin.ordering.entity;

import java.util.UUID;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Dòng giỏ hàng – chỉ lưu productId + số lượng; giá luôn lấy mới từ catalog. */
@Entity
@Table(name = "cart_item", schema = "ordering")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    private int quantity;

    @Column(nullable = false)
    private Instant addedAt;

    CartItem(UUID productId, int quantity, Instant addedAt) {
        this.productId = productId;
        this.quantity = quantity;
        this.addedAt = addedAt;
    }

    void changeQuantity(int quantity) {
        this.quantity = quantity;
    }
}
