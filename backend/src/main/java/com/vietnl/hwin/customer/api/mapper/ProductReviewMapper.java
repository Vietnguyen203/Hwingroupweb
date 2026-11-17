package com.vietnl.hwin.customer.api.mapper;

import org.mapstruct.Mapper;

import com.vietnl.hwin.customer.api.dto.ProductReviewResponse;
import com.vietnl.hwin.customer.api.dto.ProductReviewSummaryResponse;
import com.vietnl.hwin.customer.api.dto.ReviewEligibilityResponse;
import com.vietnl.hwin.customer.entity.ProductReview;
import com.vietnl.hwin.customer.service.model.ProductReviewSummary;
import com.vietnl.hwin.customer.service.model.ReviewEligibility;

@Mapper
public interface ProductReviewMapper {

    default ProductReviewResponse toResponse(ProductReview r) {
        return ProductReviewResponse.builder().id(r.getId()).reviewerName(r.maskedReviewerName()).rating(r.getRating())
                .comment(r.getComment()).createdAt(r.getCreatedAt()).build();
    }

    default ProductReviewSummaryResponse toResponse(ProductReviewSummary s) {
        return ProductReviewSummaryResponse.builder().average(s.average()).total(s.total()).countByRating(s.countByRating()).build();
    }

    default ReviewEligibilityResponse toResponse(ReviewEligibility e) {
        return ReviewEligibilityResponse.builder().canReview(e.canReview()).alreadyReviewed(e.alreadyReviewed())
                .purchased(e.purchased()).build();
    }
}
