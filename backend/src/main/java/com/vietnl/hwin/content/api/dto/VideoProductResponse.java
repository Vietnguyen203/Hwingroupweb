package com.vietnl.hwin.content.api.dto;

import java.util.UUID;

/** Sản phẩm gắn với video (giá tính bằng VND, đã gồm giảm giá thêm nếu có). */
public record VideoProductResponse(UUID id, String name, String slug, String imageUrl, long price, boolean inStock, boolean active) {
}
