package com.vietnl.hwin.customer.service.model;

import java.util.Map;

/** Tổng hợp đánh giá của một sản phẩm: điểm trung bình (1 chữ số thập phân), tổng số, số lượng theo từng mức sao 1..5. */
public record ProductReviewSummary(double average, long total, Map<Integer, Long> countByRating) {
}
