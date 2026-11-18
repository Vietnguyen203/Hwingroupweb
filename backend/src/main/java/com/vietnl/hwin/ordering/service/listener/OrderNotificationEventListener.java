package com.vietnl.hwin.ordering.service.listener;

import java.util.Map;
import java.util.UUID;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.notification.NotificationService;
import com.vietnl.hwin.common.notification.NotificationType;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.event.OrderCancelledEvent;
import com.vietnl.hwin.ordering.entity.event.OrderConfirmedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderDeliveredEvent;
import com.vietnl.hwin.ordering.entity.event.OrderPlacedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderReturnedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderShippedEvent;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Thông báo thời gian thực từ sự kiện đơn hàng: đơn mới -> admin; đổi trạng thái -> khách.
 * Khóa chống trùng (dedupeKey) theo đơn + loại sự kiện nên sự kiện bị xử lý lại không tạo thông báo thứ hai.
 */
@Component
public class OrderNotificationEventListener {

    private final NotificationService notifications;
    private final OrderRepository orders;

    public OrderNotificationEventListener(NotificationService notifications, OrderRepository orders) {
        this.notifications = notifications;
        this.orders = orders;
    }

    @ApplicationModuleListener
    void on(OrderPlacedEvent e) {
        notifications.notifyAdmins(NotificationType.ORDER_PLACED,
                Map.of("orderCode", e.orderCode(), "total", e.total()),
                "/admin/orders/" + e.orderId(), "order-placed:" + e.orderId());
    }

    @ApplicationModuleListener
    void on(OrderConfirmedEvent e) {
        toCustomer(e.orderId(), e.orderCode(), NotificationType.ORDER_CONFIRMED, Map.of());
    }

    @ApplicationModuleListener
    void on(OrderShippedEvent e) {
        notifyCustomer(e.customerId(), e.orderId(), e.orderCode(), NotificationType.ORDER_SHIPPED, Map.of());
    }

    @ApplicationModuleListener
    void on(OrderDeliveredEvent e) {
        toCustomer(e.orderId(), e.orderCode(), NotificationType.ORDER_DELIVERED, Map.of());
    }

    @ApplicationModuleListener
    void on(OrderCancelledEvent e) {
        // Khách tự hủy thì không cần báo lại cho chính khách
        if (CancelReason.CUSTOMER_REQUEST.name().equals(e.reason())) {
            return;
        }
        notifyCustomer(e.customerId(), e.orderId(), e.orderCode(), NotificationType.ORDER_CANCELLED,
                Map.of("reason", e.reason()));
    }

    @ApplicationModuleListener
    void on(OrderReturnedEvent e) {
        notifyCustomer(e.customerId(), e.orderId(), e.orderCode(), NotificationType.ORDER_RETURNED, Map.of());
    }

    /** Sự kiện chỉ có mã đơn: tra khách chủ đơn rồi mới gửi. */
    private void toCustomer(UUID orderId, String orderCode, NotificationType type, Map<String, Object> extra) {
        orders.findById(orderId).map(Order::getCustomerId)
                .ifPresent(customerId -> notifyCustomer(customerId, orderId, orderCode, type, extra));
    }

    private void notifyCustomer(UUID customerId, UUID orderId, String orderCode, NotificationType type, Map<String, Object> extra) {
        Map<String, Object> data = new java.util.LinkedHashMap<>(extra);
        data.put("orderCode", orderCode);
        notifications.notifyUser(customerId, type, data, "/account/orders/" + orderCode,
                type.name().toLowerCase() + ":" + orderId);
    }
}
