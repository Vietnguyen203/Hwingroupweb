package com.vietnl.hwin.ordering.service;

import com.vietnl.hwin.ordering.service.model.CartView;
import com.vietnl.hwin.ordering.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Clock;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.ordering.entity.Cart;
import com.vietnl.hwin.ordering.entity.CartItem;
import com.vietnl.hwin.ordering.repository.CartRepository;

/**
 * Use case giỏ hàng (lưu server theo user). Công bố {@link #addItems} cho module customer (Mua lại).
 */
@Service
@NamedInterface("services")
public class CartService {

    private final CartRepository carts;
    private final CartPricing pricing;
    private final ProductQueryService products;
    private final Clock clock;

    public CartService(CartRepository carts, CartPricing pricing, ProductQueryService products, Clock clock) {
        this.carts = carts;
        this.pricing = pricing;
        this.products = products;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public CartView view(UUID userId) {
        return carts.findByUserId(userId).map(c -> pricing.price(quantities(c)))
                .orElseGet(() -> pricing.price(Map.of()));
    }

    /** Tính giá giỏ của khách chưa đăng nhập (giỏ localStorage) – không lưu gì. */
    public CartView quote(Map<UUID, Integer> quantities) {
        return pricing.price(quantities);
    }

    @Transactional
    public CartView addItem(UUID userId, UUID productId, int quantity) {
        requireProductExists(productId);
        Cart cart = loadOrCreate(userId);
        cart.add(productId, quantity, clock.instant());
        return pricing.price(quantities(carts.save(cart)));
    }

    @Transactional
    public CartView changeQuantity(UUID userId, UUID productId, int quantity) {
        Cart cart = loadOrCreate(userId);
        cart.changeQuantity(productId, quantity);
        return pricing.price(quantities(carts.save(cart)));
    }

    @Transactional
    public CartView remove(UUID userId, UUID productId) {
        Cart cart = loadOrCreate(userId);
        cart.remove(productId);
        return pricing.price(quantities(carts.save(cart)));
    }

    /** Gộp giỏ localStorage vào giỏ server sau khi đăng nhập (bỏ qua sản phẩm không tồn tại). */
    @Transactional
    public CartView merge(UUID userId, Map<UUID, Integer> lines) {
        Cart cart = loadOrCreate(userId);
        Map<UUID, Integer> existing = new LinkedHashMap<>();
        products.findSnapshots(lines.keySet()).forEach(p -> existing.put(p.id(), lines.get(p.id())));
        cart.merge(existing, clock.instant());
        return pricing.price(quantities(carts.save(cart)));
    }

    /** Dùng cho "Mua lại": thêm nhiều sản phẩm vào giỏ (productId -> số lượng). */
    @Transactional
    public void addItems(UUID userId, Map<UUID, Integer> lines) {
        Cart cart = loadOrCreate(userId);
        cart.merge(lines, clock.instant());
        carts.save(cart);
    }

    /** Xóa sản phẩm đã đặt khỏi giỏ (gọi từ listener OrderPlaced). */
    @Transactional
    public void removeProducts(UUID userId, Collection<UUID> productIds) {
        carts.findByUserId(userId).ifPresent(cart -> cart.removeProducts(productIds));
    }

    /** productId -> số lượng của giỏ hiện tại (giữ thứ tự thêm). */
    @Transactional(readOnly = true)
    public Map<UUID, Integer> quantitiesOf(UUID userId) {
        return carts.findByUserId(userId).map(CartService::quantities).orElseGet(Map::of);
    }

    private Cart loadOrCreate(UUID userId) {
        return carts.findByUserId(userId).orElseGet(() -> carts.save(Cart.createFor(userId)));
    }

    private void requireProductExists(UUID productId) {
        if (products.findSnapshot(productId).isEmpty()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PRODUCT_NOT_FOUND);
        }
    }

    private static Map<UUID, Integer> quantities(Cart cart) {
        Map<UUID, Integer> map = new LinkedHashMap<>();
        for (CartItem i : cart.getItems()) {
            map.put(i.getProductId(), i.getQuantity());
        }
        return map;
    }
}
