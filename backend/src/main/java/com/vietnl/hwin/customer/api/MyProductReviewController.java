package com.vietnl.hwin.customer.api;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.customer.api.dto.ProductReviewResponse;
import com.vietnl.hwin.customer.api.dto.ReviewEligibilityResponse;
import com.vietnl.hwin.customer.api.dto.WriteProductReviewRequest;
import com.vietnl.hwin.customer.api.mapper.ProductReviewMapper;
import com.vietnl.hwin.customer.service.ProductReviewService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Khách đã đăng nhập: xem mình có được đánh giá sản phẩm không và gửi đánh giá. */
@Tag(name = "customer")
@RestController
@RequestMapping("/api/me/product-reviews")
public class MyProductReviewController {

    private final ProductReviewService service;
    private final ProductReviewMapper mapper;

    public MyProductReviewController(ProductReviewService service, ProductReviewMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/eligibility")
    public ResponseEntity<ReviewEligibilityResponse> eligibility(@AuthenticationPrincipal AuthPrincipal me,
                                                                 @RequestParam UUID productId) {
        return ResponseEntity.ok(mapper.toResponse(service.eligibility(me.userId(), productId)));
    }

    @PostMapping
    public ResponseEntity<ProductReviewResponse> write(@AuthenticationPrincipal AuthPrincipal me,
                                                       @Valid @RequestBody WriteProductReviewRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                service.write(me.userId(), r.getProductId(), r.getRating(), r.getComment(), mapper::toResponse));
    }
}
