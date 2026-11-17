package com.vietnl.hwin.ordering.service.listener;

import com.vietnl.hwin.ordering.service.CartService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.ordering.entity.event.OrderItemSnapshot;
import com.vietnl.hwin.ordering.entity.event.OrderPlacedEvent;

/** Sau khi đặt hàng: xóa các sản phẩm đã đặt khỏi giỏ (transaction riêng – chỉ sửa aggregate Cart). */
@Component
public class CartClearEventListener {

    private final CartService cartService;

    public CartClearEventListener(CartService cartService) {
        this.cartService = cartService;
    }

    @ApplicationModuleListener
    void on(OrderPlacedEvent event) {
        cartService.removeProducts(event.customerId(),
                event.items().stream().map(OrderItemSnapshot::productId).toList());
    }
}
