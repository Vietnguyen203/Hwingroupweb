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
@RequestMapping("/api/cart-quotes")
public class CartQuoteController {

    private final CartService cartService;
    private final OrderMapper mapper;

    public CartQuoteController(CartService cartService, OrderMapper mapper) {
        this.cartService = cartService;
        this.mapper = mapper;
    }

    /** Công khai: tính giá giỏ localStorage của khách chưa đăng nhập (giá luôn do backend tính). */
    @PostMapping
    public ResponseEntity<CartView> quote(@Valid @RequestBody CartItemsRequest r) {
        return ResponseEntity.ok(cartService.quote(mapper.toQuantities(r.getItems())));
    }
}
