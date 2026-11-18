package com.vietnl.hwin.catalog.api.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Giấy chứng nhận chỉ cần ảnh bản scan; tiêu đề, cơ quan cấp... là tùy chọn (dữ liệu cũ vẫn có). */
public record CreateCertificateRequest(
        @Size(max = 255)
        String title,

        @Size(max = 100)
        String certNumber,

        @Size(max = 255)
        String issuer,

        LocalDate issueDate,
        LocalDate expiryDate,

        @NotBlank(message = "Image URL is required")
        @Size(max = 500)
        String imageUrl,

        String category,
        String description,
        Boolean active,
        Integer sortOrder
) {}
