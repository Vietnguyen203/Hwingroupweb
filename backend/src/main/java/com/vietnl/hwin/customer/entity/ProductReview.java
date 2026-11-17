package com.vietnl.hwin.customer.entity;

import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;
import org.springframework.http.HttpStatus;

import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.exception.ResponseException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate: đánh giá sản phẩm của khách (1 khách – 1 đánh giá / sản phẩm).
 * Điều kiện "đã nhận hàng" do service kiểm tra (cần dữ liệu đơn hàng của module ordering).
 * {@code visible=false}: ẩn khỏi trang sản phẩm (kiểm duyệt).
 */
@Entity
@Table(name = "product_reviews", schema = "customer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductReview extends AggregateRoot<ProductReview> {

    public static final int MAX_COMMENT_LENGTH = 1000;
    private static final String ANONYMOUS = "Khách hàng";

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    /** Tham chiếu catalog.products (ID, không FK xuyên schema). */
    private UUID productId;

    private UUID customerId;

    /** Tên khách tại lúc đánh giá (khi hiển thị sẽ được che bớt). */
    private String reviewerName;

    private int rating;

    private String comment;

    private boolean visible;

    public static ProductReview write(UUID productId, UUID customerId, String reviewerName, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.REVIEW_RATING_INVALID);
        }
        String text = comment == null || comment.isBlank() ? null : comment.trim();
        if (text != null && text.length() > MAX_COMMENT_LENGTH) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.REVIEW_COMMENT_TOO_LONG,
                    Map.of("max", String.valueOf(MAX_COMMENT_LENGTH)));
        }
        ProductReview r = new ProductReview();
        r.productId = productId;
        r.customerId = customerId;
        r.reviewerName = reviewerName == null || reviewerName.isBlank() ? ANONYMOUS : reviewerName.trim();
        r.rating = rating;
        r.comment = text;
        r.visible = true;
        return r;
    }

    /** "Trần Văn Bình" -> "Trần V. B." (không lộ họ tên đầy đủ). */
    public String maskedReviewerName() {
        if (ANONYMOUS.equals(reviewerName)) {
            return reviewerName;
        }
        String[] parts = reviewerName.split("\\s+");
        if (parts.length == 1) {
            return parts[0];
        }
        StringBuilder sb = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            sb.append(' ').append(parts[i].substring(0, 1).toUpperCase()).append('.');
        }
        return sb.toString();
    }
}
