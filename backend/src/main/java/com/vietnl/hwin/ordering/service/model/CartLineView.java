package com.vietnl.hwin.ordering.service.model;

import java.util.UUID;
import java.util.List;

/**
 * @param problem null nếu mua được; INACTIVE (ngừng bán), OUT_OF_STOCK, INSUFFICIENT_STOCK, NOT_FOUND
 */
public record CartLineView(UUID productId, String slug, String name, String imageUrl, long unitPrice, int quantity,
                   long lineTotal, int stock, String problem) {

    public boolean available() {
        return problem == null;
    }
}
