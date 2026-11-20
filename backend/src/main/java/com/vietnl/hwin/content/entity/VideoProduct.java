package com.vietnl.hwin.content.entity;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Sản phẩm được giới thiệu trong một video (thuộc aggregate {@link Video}). */
@Entity
@Table(name = "video_products", schema = "content")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VideoProduct {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private UUID productId;

    private int displayOrder;

    VideoProduct(UUID productId, int displayOrder) {
        this.productId = productId;
        this.displayOrder = displayOrder;
    }

    void moveTo(int displayOrder) {
        this.displayOrder = displayOrder;
    }
}
