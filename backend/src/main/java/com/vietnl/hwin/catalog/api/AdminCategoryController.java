package com.vietnl.hwin.catalog.api;

import org.springframework.http.ResponseEntity;
import java.util.UUID;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.dto.CategoryResponse;
import com.vietnl.hwin.catalog.api.dto.SaveCategoryRequest;
import com.vietnl.hwin.catalog.api.mapper.ProductMapper;
import com.vietnl.hwin.catalog.service.CategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị danh mục (quyền ADMIN do SecurityConfig chặn theo /api/admin/**). */
@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final ProductMapper mapper;

    public AdminCategoryController(CategoryService categoryService, ProductMapper mapper) {
        this.categoryService = categoryService;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list() {
        return ResponseEntity.ok(categoryService.listAll(mapper::toResponse));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody SaveCategoryRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(categoryService.create(r.getName(), r.getSlug(), r.getIconUrl(), r.getSortOrder())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable UUID id, @Valid @RequestBody SaveCategoryRequest r) {
        return ResponseEntity.ok(mapper.toResponse(categoryService.update(id, r.getName(), r.getSlug(), r.getIconUrl(), r.getSortOrder(), r.isActive())));
    }

    /** Ẩn danh mục (không xóa cứng). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        categoryService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
