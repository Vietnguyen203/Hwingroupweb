package com.vietnl.hwin.ordering.entity;

import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.common.domain.AggregateRoot;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: giỏ hàng của một user (lưu server). Mỗi sản phẩm một dòng, tối đa 99 / dòng, 50 dòng / giỏ.
 */
@Entity
@Table(name = "cart", schema = "ordering")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Cart extends AggregateRoot<Cart> {

    public static final int MAX_QUANTITY = 99;
    public static final int MAX_LINES = 50;

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID userId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "cart_id", nullable = false)
    @OrderBy("addedAt ASC")
    private List<CartItem> items = new ArrayList<>();

    public static Cart createFor(UUID userId) {
        Cart c = new Cart();
        c.userId = userId;
        return c;
    }

    /** Thêm sản phẩm (cộng dồn nếu đã có), giới hạn 99. */
    public void add(UUID productId, int quantity, Instant now) {
        requirePositive(quantity);
        Optional<CartItem> existing = find(productId);
        if (existing.isPresent()) {
            existing.get().changeQuantity(Math.min(MAX_QUANTITY, existing.get().getQuantity() + quantity));
            return;
        }
        if (items.size() >= MAX_LINES) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CART_FULL, Map.of("max", String.valueOf(MAX_LINES)));
        }
        items.add(new CartItem(productId, Math.min(MAX_QUANTITY, quantity), now));
    }

    public void changeQuantity(UUID productId, int quantity) {
        requirePositive(quantity);
        find(productId).orElseThrow(() -> new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CART_ITEM_NOT_FOUND))
                .changeQuantity(Math.min(MAX_QUANTITY, quantity));
    }

    public void remove(UUID productId) {
        items.removeIf(i -> i.getProductId().equals(productId));
    }

    /** Gộp giỏ localStorage (khách chưa đăng nhập) vào giỏ server sau khi đăng nhập. */
    public void merge(Map<UUID, Integer> lines, Instant now) {
        lines.forEach((productId, qty) -> {
            if (qty != null && qty > 0) {
                add(productId, qty, now);
            }
        });
    }

    /** Xóa các sản phẩm đã đặt hàng. */
    public void removeProducts(Collection<UUID> productIds) {
        items.removeIf(i -> productIds.contains(i.getProductId()));
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public List<CartItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    private Optional<CartItem> find(UUID productId) {
        return items.stream().filter(i -> i.getProductId().equals(productId)).findFirst();
    }

    private static void requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.QUANTITY_INVALID);
        }
    }
}
