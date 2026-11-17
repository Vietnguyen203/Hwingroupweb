package com.vietnl.hwin.customer.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** canReview=true khi khách đã nhận hàng và chưa đánh giá sản phẩm. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEligibilityResponse {

    private boolean canReview;
    private boolean alreadyReviewed;
    private boolean purchased;
}
