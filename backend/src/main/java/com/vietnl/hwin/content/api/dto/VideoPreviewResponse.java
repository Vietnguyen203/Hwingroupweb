package com.vietnl.hwin.content.api.dto;

/** Kết quả xem trước một link video (chưa lưu). {@code thumbnailUrl} chỉ có khi suy ra được (YouTube). */
public record VideoPreviewResponse(String platform, String externalId, String sourceUrl, String embedUrl, String thumbnailUrl) {
}
