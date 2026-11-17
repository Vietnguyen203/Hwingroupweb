package com.vietnl.hwin.customer.service.model;

/** Khách có được đánh giá sản phẩm không: phải đã nhận hàng và chưa đánh giá. */
public record ReviewEligibility(boolean canReview, boolean alreadyReviewed, boolean purchased) {
}
