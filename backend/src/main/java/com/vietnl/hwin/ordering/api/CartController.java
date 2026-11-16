package com.vietnl.hwin.ordering.api;

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
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.CartItemRequest;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.CartLinesRequest;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.QuantityRequest;
import com.vietnl.hwin.ordering.api.mapper.OrderingMapper;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.CartView;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Giỏ hàng server của user đang đăng nhập + tính giá giỏ ẩn danh. */
@Tag(name = "ordering")
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final OrderingMapper mapper;

    public CartController(CartService cartService, OrderingMapper mapper) {
        this.cartService = cartService;
        this.mapper = mapper;
    }

    @GetMapping
    public CartView get(@AuthenticationPrincipal AuthPrincipal me) {
        return cartService.view(me.userId());
    }

    @PostMapping("/items")
    public CartView add(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody CartItemRequest r) {
        return cartService.addItem(me.userId(), r.productId(), r.quantity());
    }

    @PatchMapping("/items/{productId}")
    public CartView changeQuantity(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID productId,
                                   @Valid @RequestBody QuantityRequest r) {
        return cartService.changeQuantity(me.userId(), productId, r.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartView remove(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID productId) {
        return cartService.remove(me.userId(), productId);
    }

    /** Gộp giỏ localStorage vào giỏ server ngay sau khi đăng nhập. */
    @PostMapping("/merge")
    public CartView merge(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody CartLinesRequest r) {
        return cartService.merge(me.userId(), mapper.toQuantities(r.items()));
    }

    /** Công khai: tính giá giỏ localStorage của khách chưa đăng nhập (giá luôn do backend tính). */
    @PostMapping("/quote")
    public CartView quote(@Valid @RequestBody CartLinesRequest r) {
        return cartService.quote(mapper.toQuantities(r.items()));
    }
}
