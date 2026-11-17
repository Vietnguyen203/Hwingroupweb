// Kiểu dữ liệu đánh giá sản phẩm (khớp DTO backend module customer)

export type ProductReviewResponse = {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ProductReviewSummaryResponse = {
  average: number;
  total: number;
  /** Số đánh giá theo từng mức sao (key "5".."1"). */
  countByRating: Record<string, number>;
};

export type ReviewEligibilityResponse = {
  canReview: boolean;
  alreadyReviewed: boolean;
  purchased: boolean;
};
