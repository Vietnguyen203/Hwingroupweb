package com.vietnl.hwin.customer.api.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Đánh giá cho màn hình kiểm duyệt của admin (tên người đánh giá đầy đủ, có cả đánh giá đã ẩn). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductReviewResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSlug;
    private String reviewerName;
    private int rating;
    private String comment;
    private boolean visible;
    private Instant createdAt;
}
