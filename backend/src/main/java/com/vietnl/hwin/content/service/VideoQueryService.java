package com.vietnl.hwin.content.service;

import java.util.UUID;

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
import com.vietnl.hwin.catalog.service.model.CategorySnapshot;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.content.entity.ExceptionMessage;
import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoStatus;
import com.vietnl.hwin.content.repository.VideoRepository;
import com.vietnl.hwin.content.repository.VideoSpecifications;
import com.vietnl.hwin.content.service.model.VideoView;

/** API khách: chỉ video đã đăng (PUBLISHED); video ẩn hoặc không tồn tại đều trả "không tìm thấy". */
@Service
public class VideoQueryService {

    private final VideoRepository videos;
    private final VideoViewFactory views;
    private final CategoryQueryService categories;

    public VideoQueryService(VideoRepository videos, VideoViewFactory views, CategoryQueryService categories) {
        this.videos = videos;
        this.views = views;
        this.categories = categories;
    }

    /** @param categorySlug lọc theo danh mục (slug, giống API sản phẩm); slug không tồn tại thì trả danh sách rỗng. */
    @Transactional(readOnly = true)
    public Page<VideoView> listPublished(String q, VideoPlatform platform, String categorySlug, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        UUID categoryId = null;
        if (categorySlug != null && !categorySlug.isBlank()) {
            categoryId = categories.findBySlug(categorySlug.trim()).map(CategorySnapshot::id).orElse(null);
            if (categoryId == null) {
                return Page.empty(pageable);
            }
        }
        Specification<Video> spec = VideoSpecifications.allOf(VideoSpecifications.status(VideoStatus.PUBLISHED),
                VideoSpecifications.titleContains(q), VideoSpecifications.platform(platform), VideoSpecifications.category(categoryId));
        Page<Video> result = videos.findAll(spec, pageable);
        return new PageImpl<>(views.build(result.getContent(), true), pageable, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public VideoView getPublished(String slug) {
        Video video = videos.findBySlug(slug).filter(Video::isPublished)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.VIDEO_NOT_FOUND));
        return views.build(video, true);
    }
}
