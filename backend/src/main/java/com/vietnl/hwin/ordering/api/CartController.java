package com.vietnl.hwin.ordering.api;

import org.springframework.http.ResponseEntity;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.ordering.api.dto.AddCartItemRequest;
import com.vietnl.hwin.ordering.api.dto.CartItemsRequest;
import com.vietnl.hwin.ordering.api.dto.UpdateCartItemRequest;
import com.vietnl.hwin.ordering.api.mapper.OrderMapper;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.model.CartView;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Giỏ hàng server của user đang đăng nhập + tính giá giỏ ẩn danh. */
@Tag(name = "ordering")
@RestController
@RequestMapping("/api/me/cart")
public class CartController {

    private final CartService cartService;
    private final OrderMapper mapper;

    public CartController(CartService cartService, OrderMapper mapper) {
        this.cartService = cartService;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<CartView> get(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(cartService.view(me.userId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartView> add(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody AddCartItemRequest r) {
        return ResponseEntity.ok(cartService.addItem(me.userId(), r.getProductId(), r.getQuantity()));
    }

    @PatchMapping("/items/{productId}")
    public ResponseEntity<CartView> changeQuantity(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID productId,
                                   @Valid @RequestBody UpdateCartItemRequest r) {
        return ResponseEntity.ok(cartService.changeQuantity(me.userId(), productId, r.getQuantity()));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartView> remove(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID productId) {
        return ResponseEntity.ok(cartService.remove(me.userId(), productId));
    }

    /** Gộp giỏ localStorage vào giỏ server ngay sau khi đăng nhập. */
    @PostMapping("/merge")
    public ResponseEntity<CartView> merge(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody CartItemsRequest r) {
        return ResponseEntity.ok(cartService.merge(me.userId(), mapper.toQuantities(r.getItems())));
    }

}
