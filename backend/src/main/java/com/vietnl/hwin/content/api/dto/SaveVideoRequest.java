package com.vietnl.hwin.content.api.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoStatus;

/**
 * Thêm / sửa video. Admin chỉ nhập link gốc; nền tảng, mã video và địa chỉ nhúng do backend tự dựng.
 * {@code platform} (tùy chọn) chỉ để đối chiếu: khác nền tảng nhận ra từ link thì bị từ chối.
 * Khi sửa, {@code status} và {@code productIds} bỏ trống nghĩa là giữ nguyên.
 */
public record SaveVideoRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @NotBlank @Size(max = 1000) String sourceUrl,
        VideoPlatform platform,
        @Size(max = 1000) String thumbnailUrl,
        UUID categoryId,
        @Min(0) @Max(100000) Integer displayOrder,
        VideoStatus status,
        @Size(max = 20) List<UUID> productIds) {
}
