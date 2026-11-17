package com.vietnl.hwin.catalog.service;

import com.vietnl.hwin.catalog.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.repository.InventoryRepository;

/**
 * Service công bố: trừ / hoàn tồn kho theo đơn hàng. Được gọi từ listener của ordering
 * khi nhận OrderPlaced / OrderCancelled / OrderReturned.
 * - Idempotent nhờ unique (order_id, product_id, type) của stock_movement.
 * - Chạy transaction riêng (REQUIRES_NEW): thiếu hàng -> rollback toàn bộ lô, không ảnh hưởng
 *   transaction của người gọi.
 */
@Service
@NamedInterface("inventory")
public class InventoryService {

    public static final String OUT_OF_STOCK = "OUT_OF_STOCK";

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryRepository inventory;

    public InventoryService(InventoryRepository inventory) {
        this.inventory = inventory;
    }

    /**
     * Trừ kho cho cả đơn (tất cả hoặc không gì cả).
     *
     * @param quantities productId -> số lượng
     * @throws ResponseException mã {@link #OUT_OF_STOCK} nếu một sản phẩm không đủ hàng
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deductForOrder(UUID orderId, Map<UUID, Integer> quantities) {
        quantities.forEach((productId, qty) -> {
            if (inventory.recordMovement(productId, orderId, "DEDUCT", qty) == 0) {
                return; // đã trừ trước đó (event phát lại)
            }
            if (inventory.deduct(productId, qty) == 0) {
                throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.OUT_OF_STOCK).withDetail("productId", productId);
            }
        });
        log.debug("Đã trừ kho cho đơn {}", orderId);
    }

    /** Hoàn kho cho đơn đã trừ kho (không làm gì nếu chưa từng trừ hoặc đã hoàn). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void restoreForOrder(UUID orderId) {
        List<Object[]> rows = inventory.findDeducted(orderId);
        for (Object[] row : rows) {
            UUID productId = (UUID) row[0];
            int qty = ((Number) row[1]).intValue();
            if (inventory.recordMovement(productId, orderId, "RESTORE", qty) == 1) {
                inventory.restore(productId, qty);
            }
        }
        log.debug("Đã hoàn kho cho đơn {} ({} dòng)", orderId, rows.size());
    }
}
