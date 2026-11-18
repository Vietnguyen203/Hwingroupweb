package com.vietnl.hwin.catalog.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.vietnl.hwin.catalog.entity.Certificate;

public record CertificateResponse(
        UUID id,
        String title,
        String certNumber,
        String issuer,
        LocalDate issueDate,
        LocalDate expiryDate,
        String imageUrl,
        String category,
        String description,
        boolean active,
        int sortOrder,
        OffsetDateTime createdAt
) {
    public static CertificateResponse from(Certificate c) {
        return new CertificateResponse(
                c.getId(),
                c.getTitle(),
                c.getCertNumber(),
                c.getIssuer(),
                c.getIssueDate(),
                c.getExpiryDate(),
                c.getImageUrl(),
                c.getCategory(),
                c.getDescription(),
                c.isActive(),
                c.getSortOrder(),
                c.getCreatedAt()
        );
    }
}
