package com.vietnl.hwin.catalog.entity;

import java.util.Map;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import org.hibernate.annotations.BatchSize;

import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.util.TextNormalizer;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: sản phẩm (không có biến thể – mỗi sản phẩm một giá).
 * Tham chiếu Category bằng ID (aggregate khác).
 */
@Entity
@Table(name = "product", schema = "catalog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends AggregateRoot<Product> {

    private static final int MAX_IMAGES = 10;

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID categoryId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private Money price;

    /** Giá gốc để hiển thị gạch ngang; null nếu không giảm giá. */
    private Money compareAtPrice;

    private String shortDescription;

    private String description;

    private String unit;

    private int stock;

    private boolean active;

    private boolean bestseller;

    private int soldCount;

    @Embedded
    private FoodInfo foodInfo;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "product_id", nullable = false)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<ProductImage> images = new ArrayList<>();

    /** Cột do DB tự sinh (bỏ dấu tên + mô tả ngắn) để tìm kiếm. */
    @Column(name = "search_text", insertable = false, updatable = false)
    private String searchText;

    public static Product create(ProductDetails details, int initialStock, List<String> imageUrls) {
        Product p = new Product();
        p.active = true;
        p.updateDetails(details);
        p.adjustStock(initialStock);
        p.replaceImages(imageUrls);
        return p;
    }

    public void updateDetails(ProductDetails d) {
        if (d.name() == null || d.name().isBlank()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_NAME_REQUIRED);
        }
        if (d.categoryId() == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_CATEGORY_REQUIRED);
        }
        if (d.price() == null || d.price().isZero()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_PRICE_INVALID);
        }
        if (d.compareAtPrice() != null && !d.compareAtPrice().isGreaterThan(d.price())) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMPARE_PRICE_INVALID);
        }
        this.categoryId = d.categoryId();
        this.name = d.name().trim();
        this.slug = TextNormalizer.slugify(d.slug() == null || d.slug().isBlank() ? d.name() : d.slug());
        this.price = d.price();
        this.compareAtPrice = d.compareAtPrice();
        this.shortDescription = d.shortDescription();
        this.description = d.description();
        this.unit = d.unit();
        this.foodInfo = d.foodInfo();
    }

    public void replaceImages(List<String> urls) {
        List<String> clean = urls == null ? List.of() : urls.stream().filter(u -> u != null && !u.isBlank()).toList();
        if (clean.size() > MAX_IMAGES) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.TOO_MANY_IMAGES, Map.of("max", String.valueOf(MAX_IMAGES)));
        }
        images.clear();
        for (int i = 0; i < clean.size(); i++) {
            images.add(new ProductImage(clean.get(i), i));
        }
    }

    /** Điều chỉnh tồn kho thủ công (nhập hàng / kiểm kê). Không cho âm. */
    public void adjustStock(int delta) {
        if (stock + delta < 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.STOCK_NEGATIVE);
        }
        this.stock += delta;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void markBestseller(boolean bestseller) {
        this.bestseller = bestseller;
    }

    public boolean isInStock() {
        return stock > 0;
    }

    public boolean isPurchasable() {
        return active && stock > 0;
    }

    public String mainImageUrl() {
        return images.isEmpty() ? null : images.get(0).getUrl();
    }

    /** Phần trăm giảm so với giá gốc (làm tròn), 0 nếu không có giá gốc. */
    public int discountPercent() {
        if (compareAtPrice == null || compareAtPrice.isZero()) {
            return 0;
        }
        return (int) Math.round(100.0 * (compareAtPrice.amount() - price.amount()) / compareAtPrice.amount());
    }

    public List<ProductImage> getImages() {
        return Collections.unmodifiableList(images);
    }
}
