package com.vietnl.hwin.customer.api.dto;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Một đánh giá hiển thị trên trang sản phẩm – tên người đánh giá đã được che bớt. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewResponse {

    private UUID id;
    private String reviewerName;
    private int rating;
    private String comment;
    private Instant createdAt;
}
