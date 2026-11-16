package com.vietnl.hwin.catalog.entity;

import jakarta.persistence.Embeddable;

/**
 * Value object: thông tin bắt buộc với thực phẩm chế biến.
 *
 * @param manufacturer         nhà sản xuất (NSX)
 * @param shelfLife            hạn sử dụng / thời hạn sử dụng, ví dụ "12 tháng kể từ NSX"
 * @param storageInstructions  hướng dẫn bảo quản
 * @param declarationNumber    số giấy tự công bố sản phẩm
 * @param foodSafetyCertNumber số giấy chứng nhận cơ sở đủ điều kiện ATTP
 * @param foodSafetyCertUrl    ảnh giấy chứng nhận ATTP
 */
@Embeddable
public record FoodInfo(
        String manufacturer,
        String shelfLife,
        String storageInstructions,
        String declarationNumber,
        String foodSafetyCertNumber,
        String foodSafetyCertUrl) {
}
