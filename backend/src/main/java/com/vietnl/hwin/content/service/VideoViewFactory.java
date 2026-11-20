package com.vietnl.hwin.content.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.catalog.service.CategoryQueryService;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.CategorySnapshot;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.entity.VideoProduct;
import com.vietnl.hwin.content.service.model.VideoView;

/** Dựng {@link VideoView} cho nhiều video cùng lúc (tra sản phẩm và danh mục một lượt, không N+1). */
@Component
class VideoViewFactory {

    private final ProductQueryService products;
    private final CategoryQueryService categories;

    VideoViewFactory(ProductQueryService products, CategoryQueryService categories) {
        this.products = products;
        this.categories = categories;
    }

    /** @param publicView true: chỉ giữ sản phẩm đang bán (active) – dùng cho API khách. */
    List<VideoView> build(List<Video> videos, boolean publicView) {
        Set<UUID> productIds = new HashSet<>();
        Set<UUID> categoryIds = new HashSet<>();
        for (Video v : videos) {
            v.getProducts().forEach(p -> productIds.add(p.getProductId()));
            if (v.getCategoryId() != null) {
                categoryIds.add(v.getCategoryId());
            }
        }
        Map<UUID, ProductSnapshot> productById = products.findSnapshots(productIds).stream()
                .collect(Collectors.toMap(ProductSnapshot::id, Function.identity()));
        Map<UUID, CategorySnapshot> categoryById = categories.findSnapshots(categoryIds).stream()
                .collect(Collectors.toMap(CategorySnapshot::id, Function.identity()));

        return videos.stream().map(v -> {
            List<ProductSnapshot> ordered = v.getProducts().stream()
                    .sorted(Comparator.comparingInt(VideoProduct::getDisplayOrder))
                    .map(p -> productById.get(p.getProductId()))
                    .filter(s -> s != null && (!publicView || s.active()))
                    .toList();
            return new VideoView(v, ordered, v.getCategoryId() == null ? null : categoryById.get(v.getCategoryId()));
        }).toList();
    }

    VideoView build(Video video, boolean publicView) {
        return build(List.of(video), publicView).get(0);
    }
}
