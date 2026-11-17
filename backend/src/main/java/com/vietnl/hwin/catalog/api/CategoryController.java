package com.vietnl.hwin.catalog.api;

import org.springframework.http.ResponseEntity;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.responses.CategoryResponse;
import com.vietnl.hwin.catalog.api.mapper.CatalogMapper;
import com.vietnl.hwin.catalog.service.CategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "catalog")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CatalogMapper mapper;

    public CategoryController(CategoryService categoryService, CatalogMapper mapper) {
        this.categoryService = categoryService;
        this.mapper = mapper;
    }

    /** Danh mục đang hiển thị, theo thứ tự (menu icon trang chủ). */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> list() {
        return ResponseEntity.ok(categoryService.listActive(mapper::toResponse));
    }
}
