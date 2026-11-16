package com.vietnl.hwin.ordering.entity;

import com.vietnl.hwin.common.domain.Money;

/**
 * Dữ liệu một dòng khi đặt hàng – giá lấy từ catalog ở backend, KHÔNG từ client.
 */
public record OrderLine(Long productId, String productName, String productSlug, String imageUrl,
                        Money unitPrice, int quantity) {
}
