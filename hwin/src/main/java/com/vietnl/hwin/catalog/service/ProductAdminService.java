package com.vietnl.hwin.catalog.service;

import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.entity.ProductDetails;
import com.vietnl.hwin.catalog.repository.CategoryRepository;
import com.vietnl.hwin.catalog.repository.ProductRepository;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.exception.NotFoundException;

/** Use case quản trị sản phẩm. Service chỉ điều phối, quy tắc nằm trong Product. */
@Service
public class ProductAdminService {

    private final ProductRepository products;
    private final CategoryRepository categories;

    public ProductAdminService(ProductRepository products, CategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public <T> T get(Long id, Function<Product, T> mapper) {
        return mapper.apply(load(id));
    }

    @Transactional
    public Long create(ProductDetails details, int stock, List<String> imageUrls, boolean bestseller) {
        ensureCategoryExists(details.categoryId());
        Product p = Product.create(details, stock, imageUrls);
        p.markBestseller(bestseller);
        if (products.existsBySlug(p.getSlug())) {
            throw new DomainException("SLUG_TAKEN", "Slug sản phẩm đã tồn tại");
        }
        return products.save(p).getId();
    }

    @Transactional
    public void update(Long id, ProductDetails details, List<String> imageUrls, boolean bestseller) {
        ensureCategoryExists(details.categoryId());
        Product p = load(id);
        p.updateDetails(details);
        p.replaceImages(imageUrls);
        p.markBestseller(bestseller);
        if (products.existsBySlugAndIdNot(p.getSlug(), id)) {
            throw new DomainException("SLUG_TAKEN", "Slug sản phẩm đã tồn tại");
        }
    }

    @Transactional
    public void adjustStock(Long id, int delta) {
        load(id).adjustStock(delta);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Product p = load(id);
        if (active) {
            p.activate();
        } else {
            p.deactivate();
        }
    }

    private Product load(Long id) {
        return products.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
    }

    private void ensureCategoryExists(Long categoryId) {
        if (categoryId == null || !categories.existsById(categoryId)) {
            throw new DomainException("CATEGORY_NOT_FOUND", "Danh mục không tồn tại");
        }
    }
}
