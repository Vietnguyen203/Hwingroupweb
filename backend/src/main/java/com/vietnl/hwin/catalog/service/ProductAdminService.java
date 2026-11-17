package com.vietnl.hwin.catalog.service;

import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.catalog.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.entity.ProductDetails;
import com.vietnl.hwin.catalog.repository.CategoryRepository;
import com.vietnl.hwin.catalog.repository.ProductRepository;

/** Use case quản trị sản phẩm. Service chỉ điều phối, quy tắc nằm trong Product. */
@Service
public class ProductAdminService {

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final AuditLogger audit;

    public ProductAdminService(ProductRepository products, CategoryRepository categories, AuditLogger audit) {
        this.products = products;
        this.categories = categories;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public <T> T get(UUID id, Function<Product, T> mapper) {
        return mapper.apply(load(id));
    }

    @Transactional
    public UUID create(ProductDetails details, int stock, List<String> imageUrls, boolean bestseller) {
        ensureCategoryExists(details.categoryId());
        Product p = Product.create(details, stock, imageUrls);
        p.markBestseller(bestseller);
        if (products.existsBySlug(p.getSlug())) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_SLUG_TAKEN);
        }
        return products.save(p).getId();
    }

    @Transactional
    public void update(UUID id, ProductDetails details, List<String> imageUrls, boolean bestseller) {
        ensureCategoryExists(details.categoryId());
        Product p = load(id);
        p.updateDetails(details);
        p.replaceImages(imageUrls);
        p.markBestseller(bestseller);
        if (products.existsBySlugAndIdNot(p.getSlug(), id)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_SLUG_TAKEN);
        }
    }

    @Transactional
    public void setCategory(UUID id, UUID categoryId) {
        if (categoryId != null) {
            ensureCategoryExists(categoryId);
        }
        load(id).setCategory(categoryId);
    }

    @Transactional
    public void adjustStock(UUID id, int delta) {
        load(id).adjustStock(delta);
    }

    /** Đặt giảm giá thêm (%) cho sản phẩm / combo. Chỉ ADMIN gọi (chặn ở SecurityConfig: /api/admin/**). Có ghi audit. */
    @Transactional
    public void setSale(UUID id, int percent, UUID adminId) {
        Product p = load(id);
        int before = p.getSalePercent();
        p.changeSalePercent(percent);
        audit.log("catalog", "Product", p.getId(), "SALE_CHANGED", adminId, p.getEffectivePrice().amount(),
                "{\"from\":" + before + ",\"to\":" + percent + "}");
    }

    @Transactional
    public void setActive(UUID id, boolean active) {
        Product p = load(id);
        if (active) {
            p.activate();
        } else {
            p.deactivate();
        }
    }

    @Transactional
    public void delete(UUID id) {
        Product p = load(id);
        products.delete(p);
    }

    private Product load(UUID id) {
        return products.findById(id).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.PRODUCT_NOT_FOUND));
    }

    private void ensureCategoryExists(UUID categoryId) {
        if (categoryId == null || !categories.existsById(categoryId)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CATEGORY_NOT_EXISTS);
        }
    }
}
