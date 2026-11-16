package com.vietnl.hwin.catalog.api;

import java.util.UUID;

import java.io.IOException;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vietnl.hwin.catalog.api.dto.CatalogDtos.ActiveRequest;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.AdminProductResponse;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.ProductUpsertRequest;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.StockAdjustRequest;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.UploadResponse;
import com.vietnl.hwin.catalog.api.mapper.CatalogMapper;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductAdminService;
import com.vietnl.hwin.catalog.service.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.integration.StorageService;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị sản phẩm + upload ảnh. */
@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin")
public class AdminProductController {

    private final ProductAdminService adminService;
    private final ProductSearchService searchService;
    private final StorageService storage;
    private final CatalogMapper mapper;

    public AdminProductController(ProductAdminService adminService, ProductSearchService searchService,
                                  StorageService storage, CatalogMapper mapper) {
        this.adminService = adminService;
        this.searchService = searchService;
        this.storage = storage;
        this.mapper = mapper;
    }

    @GetMapping("/products")
    public PageResponse<AdminProductResponse> list(@RequestParam(required = false) String q,
                                                   @RequestParam(required = false) String category,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        var criteria = new ProductSearchCriteria(q, category, ProductSort.NEWEST, page, size, false);
        return PageResponse.of(searchService.search(criteria, mapper::toAdmin), x -> x);
    }

    @GetMapping("/products/{id}")
    public AdminProductResponse get(@PathVariable UUID id) {
        return adminService.get(id, mapper::toAdmin);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, UUID> create(@Valid @RequestBody ProductUpsertRequest r) {
        UUID id = adminService.create(mapper.toDetails(r), r.initialStock() == null ? 0 : r.initialStock(),
                r.images(), r.bestseller());
        return Map.of("id", id);
    }

    @PutMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable UUID id, @Valid @RequestBody ProductUpsertRequest r) {
        adminService.update(id, mapper.toDetails(r), r.images(), r.bestseller());
    }

    @PatchMapping("/products/{id}/stock")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void adjustStock(@PathVariable UUID id, @Valid @RequestBody StockAdjustRequest r) {
        adminService.adjustStock(id, r.delta());
    }

    @PatchMapping("/products/{id}/active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setActive(@PathVariable UUID id, @RequestBody ActiveRequest r) {
        adminService.setActive(id, r.active());
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(@RequestPart("file") MultipartFile file) throws IOException {
        return new UploadResponse(storage.store(file.getInputStream(), file.getSize(), file.getContentType()));
    }
}
