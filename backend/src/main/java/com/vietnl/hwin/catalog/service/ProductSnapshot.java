package com.vietnl.hwin.catalog.service;

import java.util.UUID;

import org.springframework.modulith.NamedInterface;

/**
 * Ảnh chụp thông tin sản phẩm công bố cho module khác (ordering, customer).
 * Giá tính bằng VND.
 */
@NamedInterface("query")
public record ProductSnapshot(UUID id, String name, String slug, String imageUrl, long price, int stock,
                              boolean active) {

    public boolean isPurchasable() {
        return active && stock > 0;
    }
}
