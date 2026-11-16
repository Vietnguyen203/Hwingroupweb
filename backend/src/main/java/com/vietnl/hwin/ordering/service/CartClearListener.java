package com.vietnl.hwin.ordering.service;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.ordering.entity.OrderItemSnapshot;
import com.vietnl.hwin.ordering.entity.OrderPlaced;

/** Sau khi đặt hàng: xóa các sản phẩm đã đặt khỏi giỏ (transaction riêng – chỉ sửa aggregate Cart). */
@Component
public class CartClearListener {

    private final CartService cartService;

    public CartClearListener(CartService cartService) {
        this.cartService = cartService;
    }

    @ApplicationModuleListener
    void on(OrderPlaced event) {
        cartService.removeProducts(event.customerId(),
                event.items().stream().map(OrderItemSnapshot::productId).toList());
    }
}
