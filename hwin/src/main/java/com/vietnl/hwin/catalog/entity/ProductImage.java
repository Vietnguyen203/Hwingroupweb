package com.vietnl.hwin.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Entity con thuộc aggregate Product – chỉ sửa qua Product. */
@Entity
@Table(name = "product_image", schema = "catalog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String url;

    private int sortOrder;

    ProductImage(String url, int sortOrder) {
        this.url = url;
        this.sortOrder = sortOrder;
    }
}
