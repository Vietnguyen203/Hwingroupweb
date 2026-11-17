package com.vietnl.hwin.customer.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.customer.entity.ExceptionMessage;
import com.vietnl.hwin.customer.entity.ProductReview;
import com.vietnl.hwin.customer.repository.CustomerRepository;
import com.vietnl.hwin.customer.repository.ProductReviewRepository;
import com.vietnl.hwin.customer.service.model.ProductReviewSummary;
import com.vietnl.hwin.customer.service.model.ReviewEligibility;
import com.vietnl.hwin.ordering.service.OrderQueryService;

/**
 * Đánh giá sản phẩm: chỉ khách ĐÃ NHẬN hàng mới được đánh giá, mỗi sản phẩm một lần.
 * Đọc (danh sách, tổng hợp) công khai.
 */
@Service
public class ProductReviewService {

    private final ProductReviewRepository reviews;
    private final CustomerRepository customers;
    private final ProductQueryService products;
    private final OrderQueryService orders;

    public ProductReviewService(ProductReviewRepository reviews, CustomerRepository customers, ProductQueryService products,
                                OrderQueryService orders) {
        this.reviews = reviews;
        this.customers = customers;
        this.products = products;
        this.orders = orders;
    }

    @Transactional
    public <T> T write(UUID customerId, UUID productId, int rating, String comment, Function<ProductReview, T> mapper) {
        if (products.findSnapshot(productId).isEmpty()) {
            throw new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.REVIEW_PRODUCT_NOT_FOUND);
        }
        if (!orders.hasReceivedProduct(customerId, productId)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.REVIEW_NOT_PURCHASED);
        }
        if (reviews.existsByProductIdAndCustomerId(productId, customerId)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.REVIEW_ALREADY_EXISTS);
        }
        String name = customers.findById(customerId).map(c -> c.getFullName()).orElse(null);
        return mapper.apply(reviews.save(ProductReview.write(productId, customerId, name, rating, comment)));
    }

    @Transactional(readOnly = true)
    public ReviewEligibility eligibility(UUID customerId, UUID productId) {
        boolean purchased = orders.hasReceivedProduct(customerId, productId);
        boolean already = reviews.existsByProductIdAndCustomerId(productId, customerId);
        return new ReviewEligibility(purchased && !already, already, purchased);
    }

    @Transactional(readOnly = true)
    public <T> Page<T> list(UUID productId, int page, int size, Function<ProductReview, T> mapper) {
        return reviews.findByProductIdAndVisibleTrue(productId,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), Sort.by(Sort.Order.desc("createdAt")))).map(mapper);
    }

    @Transactional(readOnly = true)
    public ProductReviewSummary summary(UUID productId) {
        Map<Integer, Long> counts = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            counts.put(star, 0L);
        }
        long total = 0;
        long sum = 0;
        for (Object[] row : reviews.countByRating(productId)) {
            int star = ((Number) row[0]).intValue();
            long n = ((Number) row[1]).longValue();
            counts.put(star, n);
            total += n;
            sum += (long) star * n;
        }
        double avg = total == 0 ? 0 : Math.round(sum * 10.0 / total) / 10.0;
        return new ProductReviewSummary(avg, total, counts);
    }
}
