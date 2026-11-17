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
@Table(name = "products", schema = "catalog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends AggregateRoot<Product> {

    /** Mỗi sản phẩm có tối thiểu 1 và tối đa 5 ảnh. */
    public static final int MIN_IMAGES = 1;
    public static final int MAX_IMAGES = 5;
    /** Giảm giá thêm tối đa (%). */
    public static final int MAX_SALE_PERCENT = 90;

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private UUID categoryId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private Money price;

    /** Giá gốc để hiển thị gạch ngang; null nếu không giảm giá. */
    private Money compareAtPrice;

    /** Giảm giá thêm (%), 0–{@link #MAX_SALE_PERCENT}; chỉ ADMIN đặt. Tính trên {@link #price} (với combo là giá đã trừ 10%). */
    @Column(nullable = false)
    private int salePercent;

    /** Giá khách thực trả = price * (100 - salePercent) / 100; lưu sẵn để sắp xếp / truy vấn theo giá. */
    @Column(nullable = false)
    private Money effectivePrice;

    private String shortDescription;

    private String description;

    private String unit;

    /** Thông tin cơ bản hiển thị đầu trang sản phẩm. */
    private String brand;

    /** Khối lượng / quy cách (500g, 20 cái...). */
    private String weight;

    private String packaging;

    private String origin;

    /** Nội dung chi tiết: thành phần, đặc điểm, hướng dẫn sử dụng (bảo quản nằm ở FoodInfo). */
    private String ingredients;

    private String features;

    private String usageInstructions;

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

    public void setCategory(UUID categoryId) {
        this.categoryId = categoryId;
    }

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
        refreshEffectivePrice();
        this.shortDescription = d.shortDescription();
        this.description = d.description();
        this.unit = d.unit();
        this.brand = required(d.brand(), "Thương hiệu");
        this.weight = required(d.weight(), "Khối lượng");
        this.packaging = required(d.packaging(), "Đóng gói");
        this.origin = required(d.origin(), "Xuất xứ");
        this.ingredients = blankToNull(d.ingredients());
        this.features = blankToNull(d.features());
        this.usageInstructions = blankToNull(d.usageInstructions());
        this.foodInfo = d.foodInfo();
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_INFO_REQUIRED,
                    Map.of("field", field));
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Thay toàn bộ ảnh: tối thiểu {@link #MIN_IMAGES}, tối đa {@link #MAX_IMAGES}; ảnh đầu tiên là ảnh chính. */
    public void replaceImages(List<String> urls) {
        List<String> clean = urls == null ? List.of() : urls.stream().filter(u -> u != null && !u.isBlank()).toList();
        if (clean.size() < MIN_IMAGES) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_IMAGE_REQUIRED,
                    Map.of("min", String.valueOf(MIN_IMAGES)));
        }
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

    /**
     * Đặt giảm giá thêm (%). Chỉ gọi từ chức năng của ADMIN. 0 = bỏ giảm giá.
     * Ví dụ combo niêm yết 1.000.000đ (đã trừ 10%) giảm thêm 15% -> khách trả 850.000đ.
     */
    public void changeSalePercent(int percent) {
        if (percent < 0 || percent > MAX_SALE_PERCENT) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.SALE_PERCENT_INVALID,
                    Map.of("max", String.valueOf(MAX_SALE_PERCENT)));
        }
        this.salePercent = percent;
        refreshEffectivePrice();
    }

    /** Giá khách thực trả sau giảm giá thêm (làm tròn xuống đồng, tối thiểu 1đ). */
    private void refreshEffectivePrice() {
        long v = price.amount() * (100L - salePercent) / 100L;
        this.effectivePrice = Money.of(Math.max(v, 1L));
    }

    /** Giá gạch ngang hiển thị: giá gốc nếu có, nếu không thì giá niêm yết khi đang giảm thêm; null nếu không giảm. */
    public Money displayCompareAtPrice() {
        if (compareAtPrice != null) {
            return compareAtPrice;
        }
        return salePercent > 0 ? price : null;
    }

    /** Phần trăm giảm của giá thực trả so với giá gạch ngang (làm tròn), 0 nếu không có giá gạch ngang. */
    public int discountPercent() {
        Money ref = displayCompareAtPrice();
        if (ref == null || ref.isZero()) {
            return 0;
        }
        return (int) Math.round(100.0 * (ref.amount() - effectivePrice.amount()) / ref.amount());
    }

    public List<ProductImage> getImages() {
        return Collections.unmodifiableList(images);
    }
}
