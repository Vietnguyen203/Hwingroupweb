package com.vietnl.hwin.content.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.http.HttpStatus;

import com.vietnl.hwin.common.exception.ResponseException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: một video/bài đăng mạng xã hội hiển thị trên web. Video nằm ở nền tảng gốc; ở đây chỉ lưu đường dẫn
 * đã chuẩn hóa, mã video và địa chỉ nhúng do backend dựng (xem VideoLinkParser).
 */
@Entity
@Table(name = "videos", schema = "content")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Video {

    /** Số sản phẩm tối đa gắn với một video. */
    public static final int MAX_PRODUCTS = 20;

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VideoPlatform platform;

    @Column(nullable = false, length = 1000)
    private String sourceUrl;

    @Column(nullable = false, length = 200)
    private String externalId;

    @Column(nullable = false, length = 1000)
    private String embedUrl;

    @Column(length = 1000)
    private String thumbnailUrl;

    private UUID categoryId;

    @Column(nullable = false)
    private int displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VideoStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "video_id", nullable = false)
    @OrderBy("displayOrder ASC")
    @BatchSize(size = 50)
    private List<VideoProduct> products = new ArrayList<>();

    public static Video create(String title, String slug, String description, VideoPlatform platform, String sourceUrl,
                               String externalId, String embedUrl, String thumbnailUrl, UUID categoryId,
                               int displayOrder, VideoStatus status, Instant now) {
        Video v = new Video();
        v.slug = slug;
        v.status = status == null ? VideoStatus.HIDDEN : status;
        v.createdAt = now;
        v.edit(title, description, platform, sourceUrl, externalId, embedUrl, thumbnailUrl, categoryId, displayOrder, now);
        return v;
    }

    /** Sửa thông tin. Slug giữ nguyên để đường dẫn /videos/{slug} đã chia sẻ không bị hỏng. */
    public void edit(String title, String description, VideoPlatform platform, String sourceUrl, String externalId,
                     String embedUrl, String thumbnailUrl, UUID categoryId, int displayOrder, Instant now) {
        if (title == null || title.isBlank()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_TITLE_REQUIRED);
        }
        this.title = title.trim();
        this.description = description == null || description.isBlank() ? null : description.trim();
        this.platform = platform;
        this.sourceUrl = sourceUrl;
        this.externalId = externalId;
        this.embedUrl = embedUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.categoryId = categoryId;
        this.displayOrder = displayOrder;
        this.updatedAt = now;
    }

    public void changeStatus(VideoStatus status, Instant now) {
        this.status = status;
        this.updatedAt = now;
    }

    public boolean isPublished() {
        return status == VideoStatus.PUBLISHED;
    }

    /**
     * Đặt lại toàn bộ danh sách sản phẩm theo đúng thứ tự `productIds` (đã loại trùng). Sản phẩm đã có thì chỉ đổi thứ tự,
     * để không xóa rồi thêm lại cùng một khóa trong một lần lưu (vi phạm ràng buộc duy nhất).
     */
    public void replaceProducts(List<UUID> productIds, Instant now) {
        List<UUID> ordered = List.copyOf(new LinkedHashSet<>(productIds));
        if (ordered.size() > MAX_PRODUCTS) {
            throw tooManyProducts();
        }
        Map<UUID, VideoProduct> existing = products.stream().collect(Collectors.toMap(VideoProduct::getProductId, Function.identity()));
        products.removeIf(p -> !ordered.contains(p.getProductId()));
        int order = 0;
        for (UUID id : ordered) {
            VideoProduct vp = existing.get(id);
            if (vp != null) {
                vp.moveTo(order);
            } else {
                products.add(new VideoProduct(id, order));
            }
            order++;
        }
        this.updatedAt = now;
    }

    /** Thêm một sản phẩm vào cuối danh sách (đã có thì giữ nguyên). */
    public void addProduct(UUID productId, Instant now) {
        if (products.stream().anyMatch(p -> p.getProductId().equals(productId))) {
            return;
        }
        if (products.size() >= MAX_PRODUCTS) {
            throw tooManyProducts();
        }
        int next = products.stream().mapToInt(VideoProduct::getDisplayOrder).max().orElse(-1) + 1;
        products.add(new VideoProduct(productId, next));
        this.updatedAt = now;
    }

    public void removeProduct(UUID productId, Instant now) {
        if (!products.removeIf(p -> p.getProductId().equals(productId))) {
            throw new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.VIDEO_PRODUCT_NOT_FOUND);
        }
        this.updatedAt = now;
    }

    public List<VideoProduct> getProducts() {
        return Collections.unmodifiableList(products);
    }

    private static ResponseException tooManyProducts() {
        return new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_TOO_MANY_PRODUCTS,
                Map.of("max", String.valueOf(MAX_PRODUCTS)));
    }
}
