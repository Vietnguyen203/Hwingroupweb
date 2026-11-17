package com.vietnl.hwin.customer.api;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.customer.api.dto.ProductReviewResponse;
import com.vietnl.hwin.customer.api.dto.ProductReviewSummaryResponse;
import com.vietnl.hwin.customer.api.mapper.ProductReviewMapper;
import com.vietnl.hwin.customer.service.ProductReviewService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Đánh giá sản phẩm – đọc công khai (danh sách + tổng hợp số sao). */
@Tag(name = "customer")
@RestController
@RequestMapping("/api/product-reviews")
public class ProductReviewController {

    private final ProductReviewService service;
    private final ProductReviewMapper mapper;

    public ProductReviewController(ProductReviewService service, ProductReviewMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductReviewResponse>> list(@RequestParam UUID productId,
                                                                    @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                                    @RequestParam(name = "page_size", defaultValue = "10") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(service.list(productId, page, size, mapper::toResponse), x -> x));
    }

    @GetMapping("/summary")
    public ResponseEntity<ProductReviewSummaryResponse> summary(@RequestParam UUID productId) {
        return ResponseEntity.ok(mapper.toResponse(service.summary(productId)));
    }
}
