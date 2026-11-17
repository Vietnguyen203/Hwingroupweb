package com.vietnl.hwin.catalog.entity;

import java.util.UUID;

import com.vietnl.hwin.common.domain.Money;

/**
 * Value object gom các thông tin mô tả sản phẩm, dùng khi tạo/sửa Product.
 */
public record ProductDetails(
        UUID categoryId,
        String name,
        String slug,
        Money price,
        Money compareAtPrice,
        String shortDescription,
        String description,
        String unit,
        String brand,
        String weight,
        String packaging,
        String origin,
        String ingredients,
        String features,
        String usageInstructions,
        FoodInfo foodInfo) {
}
