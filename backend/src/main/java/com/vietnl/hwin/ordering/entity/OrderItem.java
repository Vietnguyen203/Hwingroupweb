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
@Table(name = "order_item", schema = "ordering")
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

    OrderItem(OrderLine line) {
        if (line.quantity() <= 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.QUANTITY_INVALID);
        }
        this.productId = line.productId();
        this.productName = line.productName();
        this.productSlug = line.productSlug();
        this.imageUrl = line.imageUrl();
        this.unitPrice = line.unitPrice();
        this.quantity = line.quantity();
        this.lineTotal = line.unitPrice().times(line.quantity());
    }
}
