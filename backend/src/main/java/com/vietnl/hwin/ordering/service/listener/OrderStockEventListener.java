package com.vietnl.hwin.ordering.service.listener;

import java.util.UUID;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.catalog.service.InventoryService;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.ordering.entity.event.OrderCancelledEvent;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.event.OrderPlacedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderReturnedEvent;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Nghe event của chính ordering rồi gọi InventoryService (catalog) để trừ / hoàn kho.
 * Đặt listener ở ordering (thay vì catalog nghe ordering) để giữ phụ thuộc một chiều ordering -> catalog.
 * Thiếu hàng (bán đồng thời) -> hệ thống tự hủy đơn với lý do OUT_OF_STOCK.
 */
@Component
public class OrderStockEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderStockEventListener.class);

    private final InventoryService inventory;
    private final OrderRepository orders;
    private final Clock clock;

    public OrderStockEventListener(InventoryService inventory, OrderRepository orders, Clock clock) {
        this.inventory = inventory;
        this.orders = orders;
        this.clock = clock;
    }

    @ApplicationModuleListener
    void on(OrderPlacedEvent event) {
        Map<UUID, Integer> quantities = new LinkedHashMap<>();
        event.items().forEach(i -> quantities.merge(i.productId(), i.quantity(), Integer::sum));
        try {
            inventory.deductForOrder(event.orderId(), quantities);
        } catch (ResponseException e) {
            if (!InventoryService.OUT_OF_STOCK.equals(e.getCode())) {
                throw e;
            }
            log.warn("Đơn {} thiếu hàng – tự hủy", event.orderCode());
            orders.findById(event.orderId()).ifPresent(order -> {
                order.cancel(CancelReason.OUT_OF_STOCK, null, false, clock.instant());
                orders.save(order);
            });
        }
    }

    @ApplicationModuleListener
    void on(OrderCancelledEvent event) {
        inventory.restoreForOrder(event.orderId());
    }

    @ApplicationModuleListener
    void on(OrderReturnedEvent event) {
        inventory.restoreForOrder(event.orderId());
    }
}
