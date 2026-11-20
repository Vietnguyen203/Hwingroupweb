package com.vietnl.hwin.ordering.service;

import com.vietnl.hwin.ordering.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Clock;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/** "Đơn của tôi": mọi thao tác đều lọc theo customerId lấy từ JWT. */
@Service
public class CustomerOrderService {

    private final OrderRepository orders;
    private final Clock clock;

    public CustomerOrderService(OrderRepository orders, Clock clock) {
        this.orders = orders;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public <T> Page<T> list(UUID customerId, OrderStatus status, int page, int size, Function<Order, T> mapper) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.desc("placedAt")));
        Page<Order> result = status == null ? orders.findByCustomerId(customerId, pageable)
                : orders.findByCustomerIdAndStatus(customerId, status, pageable);
        return result.map(mapper);
    }

    @Transactional(readOnly = true)
    public <T> T get(UUID customerId, String orderCode, Function<Order, T> mapper) {
        return mapper.apply(load(customerId, orderCode));
    }

    /** Khách tự hủy – chỉ khi đơn còn PENDING (quy tắc trong Order.cancel). */
    @Transactional
    public <T> T cancel(UUID customerId, String orderCode, Function<Order, T> mapper) {
        Order order = load(customerId, orderCode);
        order.cancel(CancelReason.CUSTOMER_REQUEST, customerId, true, clock.instant());
        return mapper.apply(orders.save(order));
    }

    /** Khách xác nhận đã nhận hàng – chỉ khi đơn đang giao (quy tắc trong Order.confirmReceived). */
    @Transactional
    public <T> T confirmReceived(UUID customerId, String orderCode, Function<Order, T> mapper) {
        Order order = load(customerId, orderCode);
        order.confirmReceived(customerId, clock.instant());
        return mapper.apply(orders.save(order));
    }

    private Order load(UUID customerId, String orderCode) {
        return orders.findByOrderCodeAndCustomerId(orderCode, customerId)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.ORDER_NOT_FOUND));
    }
}
