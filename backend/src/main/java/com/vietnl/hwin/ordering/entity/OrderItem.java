package com.vietnl.hwin.ordering.entity;

import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.common.domain.Money;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Dòng đơn hàng – chụp lại tên và giá tại thời điểm đặt (đổi giá sản phẩm sau này không ảnh hưởng đơn cũ).
 */
@Entity
@Table(name = "order_items", schema = "ordering")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String productSlug;

    private String imageUrl;

    @Column(nullable = false)
    private Money unitPrice;

    private int quantity;

    @Column(nullable = false)
    private Money lineTotal;

    /** Dòng hàng chốt giá tại lúc đặt (giá lấy từ catalog ở backend, KHÔNG từ client). */
    public static OrderItem of(UUID productId, String productName, String productSlug, String imageUrl, Money unitPrice,
                               int quantity) {
        if (quantity <= 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.QUANTITY_INVALID);
        }
        OrderItem i = new OrderItem();
        i.productId = productId;
        i.productName = productName;
        i.productSlug = productSlug;
        i.imageUrl = imageUrl;
        i.unitPrice = unitPrice;
        i.quantity = quantity;
        i.lineTotal = unitPrice.times(quantity);
        return i;
    }
}
