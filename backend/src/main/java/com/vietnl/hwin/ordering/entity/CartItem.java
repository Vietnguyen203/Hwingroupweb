package com.vietnl.hwin.ordering.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    private int quantity;

    @Column(nullable = false)
    private Instant addedAt;

    CartItem(Long productId, int quantity, Instant addedAt) {
        this.productId = productId;
        this.quantity = quantity;
        this.addedAt = addedAt;
    }

    void changeQuantity(int quantity) {
        this.quantity = quantity;
    }
}
