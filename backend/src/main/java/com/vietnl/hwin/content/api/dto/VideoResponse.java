package com.vietnl.hwin.content.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Video trả cho cả admin và khách. API khách chỉ trả video PUBLISHED nên `status` luôn là PUBLISHED ở đó;
 * `embedUrl` do backend dựng và là địa chỉ https của đúng 3 nền tảng được hỗ trợ.
 */
public record VideoResponse(UUID id, String title, String slug, String description, String platform, String sourceUrl,
                            String embedUrl, String thumbnailUrl, VideoCategoryResponse category, int displayOrder,
                            String status, Instant createdAt, Instant updatedAt, List<VideoProductResponse> products) {
}
