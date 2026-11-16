package com.vietnl.hwin.ordering.service;

import java.time.Clock;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderEnums.CancelReason;
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
    public <T> Page<T> list(Long customerId, OrderStatus status, int page, int size, Function<Order, T> mapper) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.desc("placedAt")));
        Page<Order> result = status == null ? orders.findByCustomerId(customerId, pageable)
                : orders.findByCustomerIdAndStatus(customerId, status, pageable);
        return result.map(mapper);
    }

    @Transactional(readOnly = true)
    public <T> T get(Long customerId, String orderCode, Function<Order, T> mapper) {
        return mapper.apply(load(customerId, orderCode));
    }

    /** Khách tự hủy – chỉ khi đơn còn PENDING (quy tắc trong Order.cancel). */
    @Transactional
    public <T> T cancel(Long customerId, String orderCode, Function<Order, T> mapper) {
        Order order = load(customerId, orderCode);
        order.cancel(CancelReason.CUSTOMER_REQUEST, customerId, true, clock.instant());
        return mapper.apply(orders.save(order));
    }

    private Order load(Long customerId, String orderCode) {
        return orders.findByOrderCodeAndCustomerId(orderCode, customerId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng"));
    }
}
