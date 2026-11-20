package com.vietnl.hwin.content.service;

import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.service.CategoryQueryService;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.util.TextNormalizer;
import com.vietnl.hwin.content.entity.ExceptionMessage;
import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoSort;
import com.vietnl.hwin.content.entity.VideoStatus;
import com.vietnl.hwin.content.repository.VideoRepository;
import com.vietnl.hwin.content.repository.VideoSpecifications;
import com.vietnl.hwin.content.service.model.SaveVideoCommand;
import com.vietnl.hwin.content.service.model.VideoLink;
import com.vietnl.hwin.content.service.model.VideoView;

/**
 * Quản trị video: thêm, sửa, xóa, đổi trạng thái, gắn sản phẩm. Nền tảng, mã video và địa chỉ nhúng LUÔN do
 * {@link VideoLinkParser} dựng từ link, không nhận từ client.
 */
@Service
public class VideoAdminService {

    private static final int MAX_SLUG = 200;

    private final VideoRepository videos;
    private final VideoViewFactory views;
    private final ProductQueryService products;
    private final CategoryQueryService categories;
    private final Clock clock;

    public VideoAdminService(VideoRepository videos, VideoViewFactory views, ProductQueryService products,
                             CategoryQueryService categories, Clock clock) {
        this.videos = videos;
        this.views = views;
        this.products = products;
        this.categories = categories;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<VideoView> list(String q, VideoPlatform platform, UUID categoryId, VideoStatus status, VideoSort sort,
                                int page, int size) {
        Specification<Video> spec = VideoSpecifications.allOf(VideoSpecifications.titleContains(q),
                VideoSpecifications.platform(platform), VideoSpecifications.category(categoryId),
                VideoSpecifications.status(status));
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), sortOf(sort));
        Page<Video> result = videos.findAll(spec, pageable);
        return new PageImpl<>(views.build(result.getContent(), false), pageable, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public VideoView get(UUID id) {
        return views.build(load(id), false);
    }

    /** Xem trước một link (chưa lưu): nền tảng, mã, link chuẩn hóa, địa chỉ nhúng. Không gọi mạng. */
    public VideoLink preview(String sourceUrl) {
        return VideoLinkParser.parse(sourceUrl);
    }

    @Transactional
    public VideoView create(SaveVideoCommand cmd) {
        VideoLink link = resolveLink(cmd);
        if (videos.existsByPlatformAndExternalId(link.platform(), link.externalId())) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_ALREADY_EXISTS);
        }
        UUID categoryId = checkedCategory(cmd.categoryId());
        List<UUID> productIds = checkedProducts(cmd.productIds());
        Instant now = clock.instant();
        Video video = Video.create(cmd.title(), uniqueSlug(cmd.title()), cmd.description(), link.platform(),
                link.canonicalUrl(), link.externalId(), link.embedUrl(), thumbnailFor(cmd.thumbnailUrl(), link), categoryId,
                cmd.displayOrder() == null ? 0 : cmd.displayOrder(), cmd.status(), now);
        video.replaceProducts(productIds, now);
        return views.build(videos.save(video), false);
    }

    @Transactional
    public VideoView update(UUID id, SaveVideoCommand cmd) {
        Video video = load(id);
        VideoLink link = resolveLink(cmd);
        if (videos.existsByPlatformAndExternalIdAndIdNot(link.platform(), link.externalId(), id)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_ALREADY_EXISTS);
        }
        UUID categoryId = checkedCategory(cmd.categoryId());
        List<UUID> productIds = cmd.productIds() == null ? null : checkedProducts(cmd.productIds());
        Instant now = clock.instant();
        video.edit(cmd.title(), cmd.description(), link.platform(), link.canonicalUrl(), link.externalId(), link.embedUrl(),
                thumbnailFor(cmd.thumbnailUrl(), link), categoryId,
                cmd.displayOrder() == null ? video.getDisplayOrder() : cmd.displayOrder(), now);
        if (cmd.status() != null) {
            video.changeStatus(cmd.status(), now);
        }
        if (productIds != null) {
            video.replaceProducts(productIds, now);
        }
        return views.build(videos.save(video), false);
    }

    /** Xóa hẳn video (bản ghi và các liên kết sản phẩm). Muốn tạm ẩn thì đổi trạng thái sang HIDDEN. */
    @Transactional
    public void delete(UUID id) {
        videos.delete(load(id));
    }

    @Transactional
    public VideoView setStatus(UUID id, VideoStatus status) {
        Video video = load(id);
        video.changeStatus(status, clock.instant());
        return views.build(video, false);
    }

    @Transactional
    public VideoView addProduct(UUID id, UUID productId) {
        Video video = load(id);
        checkedProducts(List.of(productId));
        video.addProduct(productId, clock.instant());
        return views.build(video, false);
    }

    @Transactional
    public VideoView removeProduct(UUID id, UUID productId) {
        Video video = load(id);
        video.removeProduct(productId, clock.instant());
        return views.build(video, false);
    }

    // ------------------------------------------------------------------ nội bộ

    private Video load(UUID id) {
        return videos.findById(id).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.VIDEO_NOT_FOUND));
    }

    /** Phân tích link; nếu admin chọn nền tảng thì phải khớp với nền tảng nhận ra từ link (không tin giá trị từ client). */
    private static VideoLink resolveLink(SaveVideoCommand cmd) {
        VideoLink link = VideoLinkParser.parse(cmd.sourceUrl());
        if (cmd.platform() != null && cmd.platform() != link.platform()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_PLATFORM_MISMATCH);
        }
        return link;
    }

    /** Ảnh bìa admin cung cấp (đã kiểm tra) hoặc ảnh suy ra từ link (YouTube); không có thì null. */
    private static String thumbnailFor(String provided, VideoLink link) {
        String normalized = VideoLinkParser.normalizeThumbnail(provided);
        return normalized != null ? normalized : link.thumbnailUrl();
    }

    private UUID checkedCategory(UUID categoryId) {
        if (categoryId != null && categories.findSnapshots(Set.of(categoryId)).isEmpty()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_CATEGORY_NOT_FOUND);
        }
        return categoryId;
    }

    /** Loại trùng (giữ thứ tự), giới hạn số lượng, và bắt buộc mọi sản phẩm phải tồn tại. */
    private List<UUID> checkedProducts(List<UUID> requested) {
        if (requested == null || requested.isEmpty()) {
            return List.of();
        }
        List<UUID> ordered = List.copyOf(new LinkedHashSet<>(requested));
        if (ordered.size() > Video.MAX_PRODUCTS) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_TOO_MANY_PRODUCTS,
                    Map.of("max", String.valueOf(Video.MAX_PRODUCTS)));
        }
        Set<UUID> found = products.findSnapshots(ordered).stream().map(ProductSnapshot::id).collect(Collectors.toSet());
        Set<UUID> missing = new HashSet<>(ordered);
        missing.removeAll(found);
        if (!missing.isEmpty()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.VIDEO_PRODUCT_NOT_FOUND)
                    .withDetail("productIds", List.copyOf(missing));
        }
        return ordered;
    }

    /** Slug từ tiêu đề; trùng thì thêm hậu tố -2, -3... */
    private String uniqueSlug(String title) {
        String base = TextNormalizer.slugify(title);
        if (base.isEmpty()) {
            base = "video";
        }
        if (base.length() > MAX_SLUG) {
            base = base.substring(0, MAX_SLUG).replaceAll("-+$", "");
        }
        String slug = base;
        for (int n = 2; videos.existsBySlug(slug); n++) {
            slug = base + "-" + n;
        }
        return slug;
    }

    private static Sort sortOf(VideoSort sort) {
        return sort == VideoSort.NEWEST
                ? Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
                : Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    }
}
