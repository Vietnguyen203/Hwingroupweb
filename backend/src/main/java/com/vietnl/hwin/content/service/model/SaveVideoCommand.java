package com.vietnl.hwin.content.service.model;

import java.util.List;
import java.util.UUID;

import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoStatus;

/**
 * Dữ liệu thêm / sửa video. {@code platform} (nếu có) chỉ để đối chiếu với nền tảng backend tự nhận ra từ link;
 * {@code status} và {@code productIds} null khi sửa nghĩa là giữ nguyên.
 */
public record SaveVideoCommand(String title, String description, String sourceUrl, VideoPlatform platform,
                               String thumbnailUrl, UUID categoryId, Integer displayOrder, VideoStatus status,
                               List<UUID> productIds) {
}
