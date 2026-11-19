package com.vietnl.hwin.catalog.service;

import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.catalog.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Category;
import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.repository.CategoryRepository;
import com.vietnl.hwin.catalog.repository.ProductRepository;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.util.TextNormalizer;

/**
 * Tìm kiếm sản phẩm cho web khách (từ khóa, danh mục, khoảng giá thực trả, còn hàng, đang giảm giá).
 * Không dấu: so khớp cột search_text (= f_unaccent(lower(tên + mô tả ngắn))) với f_unaccent(lower(từ khóa)),
 * từ khóa luôn được bind dạng tham số (không nối chuỗi SQL).
 */
@Service
public class ProductSearchService {

    private final ProductRepository products;
    private final CategoryRepository categories;

    public ProductSearchService(ProductRepository products, CategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public <T> Page<T> search(ProductSearchCriteria c, Function<Product, T> mapper) {
        List<Specification<Product>> specs = new ArrayList<>();
        if (c.onlyActive()) {
            specs.add((root, query, cb) -> cb.isTrue(root.get("active")));
        }
        if (c.categorySlug() != null && !c.categorySlug().isBlank()) {
            UUID categoryId = categories.findBySlug(c.categorySlug()).map(Category::getId).orElse(null);
            // danh mục không tồn tại -> không có kết quả
            specs.add((root, query, cb) -> categoryId == null ? cb.disjunction() : cb.equal(root.get("categoryId"), categoryId));
        }
        if (c.q() != null && !c.q().isBlank()) {
            String pattern = "%" + TextNormalizer.escapeLike(c.q().trim().toLowerCase()) + "%";
            specs.add((root, query, cb) -> {
                Expression<String> normalized = cb.function("f_unaccent", String.class, cb.literal(pattern));
                Predicate p = cb.like(root.get("searchText"), normalized, '\\');
                return p;
            });
        }
        if (c.minPrice() != null) {
            Money min = Money.of(c.minPrice());
            specs.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.<Money>get("effectivePrice"), min));
        }
        if (c.maxPrice() != null) {
            Money max = Money.of(c.maxPrice());
            specs.add((root, query, cb) -> cb.lessThanOrEqualTo(root.<Money>get("effectivePrice"), max));
        }
        if (c.inStockOnly()) {
            specs.add((root, query, cb) -> cb.greaterThan(root.<Integer>get("stock"), 0));
        }
        if (c.onSaleOnly()) {
            // khớp Product.discountPercent(): giảm thêm % hoặc giá gạch ngang cao hơn giá thực trả
            specs.add((root, query, cb) -> cb.or(
                    cb.greaterThan(root.<Integer>get("salePercent"), 0),
                    cb.greaterThan(root.<Money>get("compareAtPrice"), root.<Money>get("effectivePrice"))));
        }
        PageRequest pageable = PageRequest.of(c.page(), c.size(), toSort(c));
        return products.findAll(Specification.allOf(specs), pageable).map(mapper);
    }

    @Transactional(readOnly = true)
    public <T> List<T> bestsellers(int limit, Function<Product, T> mapper) {
        Specification<Product> spec = (root, query, cb) ->
                cb.and(cb.isTrue(root.get("active")), cb.isTrue(root.get("bestseller")));
        return products.findAll(spec, PageRequest.of(0, Math.clamp(limit, 1, 24),
                        Sort.by(Sort.Order.desc("soldCount"), Sort.Order.desc("id"))))
                .map(mapper).getContent();
    }

    @Transactional(readOnly = true)
    public <T> T getActiveBySlug(String slug, Function<Product, T> mapper) {
        return products.findBySlugAndActiveTrue(slug).map(mapper)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.PRODUCT_NOT_FOUND));
    }

    private static Sort toSort(ProductSearchCriteria c) {
        return switch (c.sort()) {
            case PRICE_ASC -> Sort.by(Sort.Order.asc("effectivePrice"), Sort.Order.desc("id"));
            case PRICE_DESC -> Sort.by(Sort.Order.desc("effectivePrice"), Sort.Order.desc("id"));
            case BESTSELLER -> Sort.by(Sort.Order.desc("soldCount"), Sort.Order.desc("id"));
            case NEWEST -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
    }
}
