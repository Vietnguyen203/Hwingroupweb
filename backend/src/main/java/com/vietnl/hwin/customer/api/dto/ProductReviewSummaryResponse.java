package com.vietnl.hwin.customer.api.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Điểm trung bình + phân bố số sao (key 5..1). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewSummaryResponse {

    private double average;
    private long total;
    private Map<Integer, Long> countByRating;
}
