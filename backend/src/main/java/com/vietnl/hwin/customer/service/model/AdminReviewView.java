package com.vietnl.hwin.customer.service.model;

import com.vietnl.hwin.customer.entity.ProductReview;

/** Đánh giá kèm tên sản phẩm, dùng cho màn hình kiểm duyệt của admin. */
public record AdminReviewView(ProductReview review, String productName, String productSlug) {
}
