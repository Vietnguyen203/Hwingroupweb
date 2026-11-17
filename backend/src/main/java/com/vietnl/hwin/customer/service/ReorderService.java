package com.vietnl.hwin.customer.service;

import com.vietnl.hwin.customer.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.ProductSnapshot;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.OrderQueryService;

/**
 * "Mua lại": chép sản phẩm của một đơn cũ vào giỏ, bỏ qua sản phẩm ngừng bán / hết hàng,
 * số lượng không vượt tồn kho. Đơn phải thuộc chính khách đó (chống IDOR).
 */
@Service
public class ReorderService {

    private final OrderQueryService orders;
    private final ProductQueryService products;
    private final CartService cart;

    public ReorderService(OrderQueryService orders, ProductQueryService products, CartService cart) {
        this.orders = orders;
        this.products = products;
        this.cart = cart;
    }

    public record Added(UUID productId, String name, int quantity) {
    }

    /** @param reason INACTIVE (ngừng bán), OUT_OF_STOCK, NOT_FOUND */
    public record Skipped(UUID productId, String name, String reason) {
    }

    public record Result(List<Added> added, List<Skipped> skipped) {
    }

    public Result reorder(UUID customerId, String orderCode) {
        Map<UUID, Integer> items = orders.findItemsForCustomer(orderCode, customerId)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.ORDER_NOT_FOUND));
        Map<UUID, ProductSnapshot> snapshots = products.findSnapshots(items.keySet()).stream()
                .collect(Collectors.toMap(ProductSnapshot::id, Function.identity()));

        Map<UUID, Integer> toAdd = new LinkedHashMap<>();
        List<Added> added = new ArrayList<>();
        List<Skipped> skipped = new ArrayList<>();
        items.forEach((productId, qty) -> {
            ProductSnapshot p = snapshots.get(productId);
            if (p == null) {
                skipped.add(new Skipped(productId, null, "NOT_FOUND"));
            } else if (!p.active()) {
                skipped.add(new Skipped(productId, p.name(), "INACTIVE"));
            } else if (p.stock() <= 0) {
                skipped.add(new Skipped(productId, p.name(), "OUT_OF_STOCK"));
            } else {
                int q = Math.min(qty, p.stock());
                toAdd.put(productId, q);
                added.add(new Added(productId, p.name(), q));
            }
        });
        if (!toAdd.isEmpty()) {
            cart.addItems(customerId, toAdd);
        }
        return new Result(added, skipped);
    }
}
