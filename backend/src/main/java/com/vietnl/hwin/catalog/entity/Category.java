package com.vietnl.hwin.catalog.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.util.TextNormalizer;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Aggregate root: danh mục sản phẩm (hiển thị dạng icon trên trang chủ). */
@Entity
@Table(name = "category", schema = "catalog")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category extends AggregateRoot<Category> {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    private String iconUrl;

    private int sortOrder;

    private boolean active;

    public static Category create(String name, String slug, String iconUrl, int sortOrder) {
        Category c = new Category();
        c.active = true;
        c.update(name, slug, iconUrl, sortOrder);
        return c;
    }

    public void update(String name, String slug, String iconUrl, int sortOrder) {
        if (name == null || name.isBlank()) {
            throw new DomainException("CATEGORY_NAME_REQUIRED", "Tên danh mục không được trống");
        }
        this.name = name.trim();
        this.slug = (slug == null || slug.isBlank()) ? TextNormalizer.slugify(name) : TextNormalizer.slugify(slug);
        this.iconUrl = iconUrl;
        this.sortOrder = sortOrder;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }
}
