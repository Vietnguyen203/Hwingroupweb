package com.vietnl.hwin.catalog.service;

import org.springframework.modulith.NamedInterface;

/**
 * Ảnh chụp thông tin sản phẩm công bố cho module khác (ordering, customer).
 * Giá tính bằng VND.
 */
@NamedInterface("query")
public record ProductSnapshot(Long id, String name, String slug, String imageUrl, long price, int stock,
                              boolean active) {

    public boolean isPurchasable() {
        return active && stock > 0;
    }
}
