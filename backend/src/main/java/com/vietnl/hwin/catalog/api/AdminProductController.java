package com.vietnl.hwin.catalog.api;

import com.vietnl.hwin.catalog.api.dto.UpdateProductSaleRequest;
import com.vietnl.hwin.common.security.AuthPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

import java.io.IOException;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vietnl.hwin.catalog.api.dto.UpdateProductStatusRequest;
import com.vietnl.hwin.catalog.api.dto.AdminProductResponse;
import com.vietnl.hwin.catalog.api.dto.SaveProductRequest;
import com.vietnl.hwin.catalog.api.dto.AdjustStockRequest;
import com.vietnl.hwin.catalog.api.dto.ImageUploadResponse;
import com.vietnl.hwin.catalog.api.mapper.ProductMapper;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductAdminService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.integration.StorageService;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị sản phẩm + upload ảnh. */
@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductAdminService adminService;
    private final ProductSearchService searchService;
    private final ProductMapper mapper;

    public AdminProductController(ProductAdminService adminService, ProductSearchService searchService, ProductMapper mapper) {
        this.adminService = adminService;
        this.searchService = searchService;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminProductResponse>> list(@RequestParam(required = false) String q,
                                                   @RequestParam(required = false) String category,
                                                   @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                   @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        var criteria = new ProductSearchCriteria(q, category, ProductSort.NEWEST, page, size, false);
        return ResponseEntity.ok(PageResponse.of(searchService.search(criteria, mapper::toAdmin), x -> x));
    }
    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.get(id, mapper::toAdmin));
    }
    @PostMapping
    public ResponseEntity<Map<String, UUID>> create(@Valid @RequestBody SaveProductRequest r) {
        UUID id = adminService.create(mapper.toDetails(r), r.getInitialStock() == null ? 0 : r.getInitialStock(),
                r.getImages(), r.isBestseller());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable UUID id, @Valid @RequestBody SaveProductRequest r) {
        adminService.update(id, mapper.toDetails(r), r.getImages(), r.isBestseller());
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Void> adjustStock(@PathVariable UUID id, @Valid @RequestBody AdjustStockRequest r) {
        adminService.adjustStock(id, r.getDelta());
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/category")
    public ResponseEntity<Void> setCategory(@PathVariable UUID id, @RequestBody Map<String, UUID> body) {
        adminService.setCategory(id, body.get("categoryId"));
        return ResponseEntity.noContent().build();
    }
    /** Giảm giá thêm (%) cho sản phẩm / combo – chỉ ADMIN. */
    @PatchMapping("/{id}/sale")
    public ResponseEntity<AdminProductResponse> setSale(@PathVariable UUID id, @Valid @RequestBody UpdateProductSaleRequest r,
                                                        @AuthenticationPrincipal AuthPrincipal me) {
        adminService.setSale(id, r.getSalePercent(), me.userId());
        return ResponseEntity.ok(adminService.get(id, mapper::toAdmin));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<Void> setActive(@PathVariable UUID id, @RequestBody UpdateProductStatusRequest r) {
        adminService.setActive(id, r.isActive());
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        adminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
