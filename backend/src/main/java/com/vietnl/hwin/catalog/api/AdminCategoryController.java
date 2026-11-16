package com.vietnl.hwin.catalog.api;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.dto.CatalogDtos.CategoryResponse;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.CategoryUpsertRequest;
import com.vietnl.hwin.catalog.api.mapper.CatalogMapper;
import com.vietnl.hwin.catalog.service.CategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị danh mục (quyền ADMIN do SecurityConfig chặn theo /api/admin/**). */
@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final CatalogMapper mapper;

    public AdminCategoryController(CategoryService categoryService, CatalogMapper mapper) {
        this.categoryService = categoryService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CategoryResponse> list() {
        return categoryService.listAll(mapper::toResponse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryUpsertRequest r) {
        return mapper.toResponse(categoryService.create(r.name(), r.slug(), r.iconUrl(), r.sortOrder()));
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryUpsertRequest r) {
        return mapper.toResponse(categoryService.update(id, r.name(), r.slug(), r.iconUrl(), r.sortOrder(), r.active()));
    }

    /** Ẩn danh mục (không xóa cứng). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        categoryService.deactivate(id);
    }
}
