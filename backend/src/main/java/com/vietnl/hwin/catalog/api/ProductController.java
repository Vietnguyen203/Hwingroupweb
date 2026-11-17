package com.vietnl.hwin.catalog.api;

import java.util.UUID;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.dto.CatalogDtos.CategoryResponse;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.ProductCardResponse;
import com.vietnl.hwin.catalog.api.dto.CatalogDtos.ProductDetailResponse;
import com.vietnl.hwin.catalog.api.mapper.CatalogMapper;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.CategoryService;
import com.vietnl.hwin.catalog.service.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "catalog")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductSearchService searchService;
    private final CategoryService categoryService;
    private final CatalogMapper mapper;

    public ProductController(ProductSearchService searchService, CategoryService categoryService,
                             CatalogMapper mapper) {
        this.searchService = searchService;
        this.categoryService = categoryService;
        this.mapper = mapper;
    }

    /** Danh sách / tìm kiếm không dấu, lọc danh mục, sắp xếp, phân trang. */
    @GetMapping
    public PageResponse<ProductCardResponse> search(@RequestParam(required = false) String q,
                                                    @RequestParam(required = false) String category,
                                                    @RequestParam(defaultValue = "NEWEST") ProductSort sort,
                                                    @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                    @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        var criteria = new ProductSearchCriteria(q, category, sort, page, size, true);
        var result = searchService.search(criteria, mapper::toCard);
        return PageResponse.of(result, Function.identity());
    }

    @GetMapping("/bestsellers")
    public List<ProductCardResponse> bestsellers(@RequestParam(defaultValue = "8") int limit) {
        return searchService.bestsellers(limit, mapper::toCard);
    }

    @GetMapping("/{slug}")
    public ProductDetailResponse detail(@PathVariable String slug) {
        Map<UUID, CategoryResponse> categories = categoryService.listAll(mapper::toResponse).stream()
                .collect(Collectors.toMap(CategoryResponse::id, Function.identity()));
        return searchService.getActiveBySlug(slug, p -> mapper.toDetail(p, categories.get(p.getCategoryId())));
    }
}
