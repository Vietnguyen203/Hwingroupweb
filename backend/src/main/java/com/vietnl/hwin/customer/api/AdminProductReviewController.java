package com.vietnl.hwin.customer.api;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.customer.api.dto.AdminProductReviewResponse;
import com.vietnl.hwin.customer.api.dto.UpdateReviewVisibilityRequest;
import com.vietnl.hwin.customer.api.mapper.ProductReviewMapper;
import com.vietnl.hwin.customer.service.ProductReviewAdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin kiểm duyệt đánh giá sản phẩm: xem tất cả, lọc, ẩn / hiện. */
@Tag(name = "customer-admin")
@RestController
@RequestMapping("/api/admin/product-reviews")
public class AdminProductReviewController {

    private final ProductReviewAdminService reviews;
    private final ProductReviewMapper mapper;

    public AdminProductReviewController(ProductReviewAdminService reviews, ProductReviewMapper mapper) {
        this.reviews = reviews;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminProductReviewResponse>> list(@RequestParam(required = false) Boolean visible,
                                                                         @RequestParam(required = false) Integer rating,
                                                                         @RequestParam(required = false) UUID productId,
                                                                         @RequestParam(required = false) String q,
                                                                         @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                                         @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(reviews.search(visible, rating, productId, q, page, size, mapper::toAdmin), x -> x));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<AdminProductReviewResponse> setVisibility(@PathVariable UUID id, @Valid @RequestBody UpdateReviewVisibilityRequest r,
                                                                    @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(reviews.setVisible(id, r.getVisible(), r.getReason(), me.userId(), mapper::toAdmin));
    }
}
