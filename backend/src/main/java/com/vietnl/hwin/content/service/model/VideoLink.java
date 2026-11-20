package com.vietnl.hwin.content.service.model;

import com.vietnl.hwin.content.entity.VideoPlatform;

/**
 * Kết quả phân tích một link video: nền tảng, mã video, link gốc đã chuẩn hóa và địa chỉ nhúng. Mọi trường do backend dựng
 * từ link (client không được gửi iframe/embed). {@code thumbnailUrl} chỉ có khi suy ra được mà không gọi mạng (YouTube).
 */
public record VideoLink(VideoPlatform platform, String externalId, String canonicalUrl, String embedUrl, String thumbnailUrl) {
}
