package com.vietnl.hwin.catalog.service;

import com.vietnl.hwin.catalog.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Category;
import com.vietnl.hwin.catalog.repository.CategoryRepository;
import com.vietnl.hwin.catalog.repository.ProductRepository;

/** Use case danh mục: xem công khai + quản trị. */
@Service
public class CategoryService {

    private final CategoryRepository categories;
    private final ProductRepository products;

    public CategoryService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public <T> List<T> listActive(Function<Category, T> mapper) {
        return categories.findAllByActiveTrueOrderBySortOrderAscIdAsc().stream().map(mapper).toList();
    }

    @Transactional(readOnly = true)
    public <T> List<T> listAll(Function<Category, T> mapper) {
        return categories.findAllByOrderBySortOrderAscIdAsc().stream().map(mapper).toList();
    }

    @Transactional(readOnly = true)
    public Category getBySlug(String slug) {
        return categories.findBySlug(slug).filter(Category::isActive)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.CATEGORY_NOT_FOUND));
    }

    @Transactional
    public Category create(String name, String slug, String iconUrl, int sortOrder) {
        Category c = Category.create(name, slug, iconUrl, sortOrder);
        if (categories.existsBySlug(c.getSlug())) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.SLUG_TAKEN);
        }
        return categories.save(c);
    }

    @Transactional
    public Category update(UUID id, String name, String slug, String iconUrl, int sortOrder, boolean active) {
        Category c = get(id);
        c.update(name, slug, iconUrl, sortOrder);
        if (categories.existsBySlugAndIdNot(c.getSlug(), id)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.SLUG_TAKEN);
        }
        if (active) {
            c.activate();
        } else {
            deactivate(c);
        }
        return c;
    }

    /** Ẩn danh mục; chặn nếu còn sản phẩm đang bán. */
    @Transactional
    public void deactivate(UUID id) {
        deactivate(get(id));
    }

    private void deactivate(Category c) {
        if (products.countByCategoryIdAndActiveTrue(c.getId()) > 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CATEGORY_IN_USE);
        }
        c.deactivate();
    }

    private Category get(UUID id) {
        return categories.findById(id).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.CATEGORY_NOT_FOUND));
    }
}
