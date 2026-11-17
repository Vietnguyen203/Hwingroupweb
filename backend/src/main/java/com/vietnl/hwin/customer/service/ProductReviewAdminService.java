package com.vietnl.hwin.customer.service;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.customer.entity.ExceptionMessage;
import com.vietnl.hwin.customer.entity.ProductReview;
import com.vietnl.hwin.customer.repository.ProductReviewRepository;
import com.vietnl.hwin.customer.service.model.AdminReviewView;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kiểm duyệt đánh giá (ADMIN): xem tất cả (kể cả đã ẩn), lọc, ẩn / hiện.
 * Đánh giá bị ẩn không còn trên trang sản phẩm và không tính vào điểm trung bình.
 */
@Service
public class ProductReviewAdminService {

    private final ProductReviewRepository reviews;
    private final ProductQueryService products;
    private final AuditLogger audit;

    public ProductReviewAdminService(ProductReviewRepository reviews, ProductQueryService products, AuditLogger audit) {
        this.reviews = reviews;
        this.products = products;
        this.audit = audit;
    }

    /** @param q tìm theo nội dung hoặc tên người đánh giá */
    @Transactional(readOnly = true)
    public <T> Page<T> search(Boolean visible, Integer rating, UUID productId, String q, int page, int size,
                              Function<AdminReviewView, T> mapper) {
        Specification<ProductReview> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (visible != null) {
                ps.add(cb.equal(root.get("visible"), visible));
            }
            if (rating != null) {
                ps.add(cb.equal(root.get("rating"), rating));
            }
            if (productId != null) {
                ps.add(cb.equal(root.get("productId"), productId));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase().replace("%", "") + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("comment")), like), cb.like(cb.lower(root.get("reviewerName")), like)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        Page<ProductReview> found = reviews.findAll(spec,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Order.desc("createdAt"))));
        Map<UUID, ProductSnapshot> names = products.findSnapshots(found.getContent().stream().map(ProductReview::getProductId).distinct().toList())
                .stream().collect(Collectors.toMap(ProductSnapshot::id, s -> s));
        return found.map(r -> {
            ProductSnapshot s = names.get(r.getProductId());
            return mapper.apply(new AdminReviewView(r, s == null ? "(sản phẩm đã xóa)" : s.name(), s == null ? null : s.slug()));
        });
    }

    /** Ẩn / hiện một đánh giá; ghi audit kèm lý do (nếu có). */
    @Transactional
    public <T> T setVisible(UUID id, boolean visible, String reason, UUID adminId, Function<AdminReviewView, T> mapper) {
        ProductReview r = reviews.findById(id)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.REVIEW_NOT_FOUND));
        if (visible) {
            r.show();
        } else {
            r.hide();
        }
        String safeReason = reason == null ? "" : reason.trim().replace("\\", "").replace("\"", "'");
        audit.log("customer", "ProductReview", r.getId(), visible ? "REVIEW_SHOWN" : "REVIEW_HIDDEN", adminId, null,
                "{\"reason\":\"" + safeReason + "\"}");
        ProductSnapshot s = products.findSnapshot(r.getProductId()).orElse(null);
        return mapper.apply(new AdminReviewView(r, s == null ? "(sản phẩm đã xóa)" : s.name(), s == null ? null : s.slug()));
    }
}
