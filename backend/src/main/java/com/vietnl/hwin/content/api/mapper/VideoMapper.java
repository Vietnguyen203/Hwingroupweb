package com.vietnl.hwin.content.api.mapper;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.content.api.dto.VideoCategoryResponse;
import com.vietnl.hwin.content.api.dto.VideoPreviewResponse;
import com.vietnl.hwin.content.api.dto.VideoProductResponse;
import com.vietnl.hwin.content.api.dto.VideoResponse;
import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.service.model.VideoLink;
import com.vietnl.hwin.content.service.model.VideoView;

@Component
public class VideoMapper {

    public VideoResponse toResponse(VideoView view) {
        Video v = view.video();
        return new VideoResponse(v.getId(), v.getTitle(), v.getSlug(), v.getDescription(), v.getPlatform().name(),
                v.getSourceUrl(), v.getEmbedUrl(), v.getThumbnailUrl(),
                view.category() == null ? null : new VideoCategoryResponse(view.category().id(), view.category().name(), view.category().slug()),
                v.getDisplayOrder(), v.getStatus().name(), v.getCreatedAt(), v.getUpdatedAt(),
                view.products().stream().map(VideoMapper::toProduct).toList());
    }

    public VideoPreviewResponse toPreview(VideoLink link) {
        return new VideoPreviewResponse(link.platform().name(), link.externalId(), link.canonicalUrl(), link.embedUrl(), link.thumbnailUrl());
    }

    private static VideoProductResponse toProduct(ProductSnapshot p) {
        return new VideoProductResponse(p.id(), p.name(), p.slug(), p.imageUrl(), p.price(), p.isPurchasable(), p.active());
    }
}
