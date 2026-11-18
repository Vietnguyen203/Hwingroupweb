package com.vietnl.hwin.catalog.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "certificates", schema = "catalog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Certificate {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(length = 255)
    private String title;

    @Column(name = "cert_number", length = 100)
    private String certNumber;

    @Column(length = 255)
    private String issuer;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false, length = 50)
    private String category; // FOOD_SAFETY, ISO_HACCP, TEST_REPORT, BUSINESS_LICENSE

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Builder
    public Certificate(String title, String certNumber, String issuer, LocalDate issueDate,
                       LocalDate expiryDate, String imageUrl, String category,
                       String description, boolean active, int sortOrder) {
        this.title = title;
        this.certNumber = certNumber;
        this.issuer = issuer;
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.imageUrl = imageUrl;
        this.category = (category != null && !category.isBlank()) ? category : "FOOD_SAFETY";
        this.description = description;
        this.active = active;
        this.sortOrder = sortOrder;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public void update(String title, String certNumber, String issuer, LocalDate issueDate,
                       LocalDate expiryDate, String imageUrl, String category,
                       String description, boolean active, int sortOrder) {
        this.title = title;
        this.certNumber = certNumber;
        this.issuer = issuer;
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.imageUrl = imageUrl;
        if (category != null && !category.isBlank()) {
            this.category = category;
        }
        this.description = description;
        this.active = active;
        this.sortOrder = sortOrder;
        this.updatedAt = OffsetDateTime.now();
    }

    public void toggleActive() {
        this.active = !this.active;
        this.updatedAt = OffsetDateTime.now();
    }
}
