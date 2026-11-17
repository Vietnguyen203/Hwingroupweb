package com.vietnl.hwin.ordering.service;

import com.vietnl.hwin.ordering.service.config.OrderingProperties;
import com.vietnl.hwin.ordering.service.model.OrderFilter;
import com.vietnl.hwin.ordering.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.entity.PaymentStatus;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.repository.OrderRepository;
import com.vietnl.hwin.ordering.service.integration.ShippingProvider;

/**
 * Use case quản trị đơn hàng. Service chỉ điều phối: load -> gọi method domain -> save (phát event).
 */
@Service
public class OrderAdminService {

    private final OrderRepository orders;
    private final ShippingProvider shipping;
    private final AuditLogger audit;
    private final OrderingProperties props;
    private final Clock clock;

    public OrderAdminService(OrderRepository orders, ShippingProvider shipping, AuditLogger audit,
                             OrderingProperties props, Clock clock) {
        this.orders = orders;
        this.shipping = shipping;
        this.audit = audit;
        this.props = props;
        this.clock = clock;
    }


    @Transactional(readOnly = true)
    public <T> Page<T> search(OrderFilter f, Function<Order, T> mapper) {
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (f.status() != null) {
                ps.add(cb.equal(root.get("status"), f.status()));
            }
            if (f.paymentMethod() != null) {
                ps.add(cb.equal(root.get("paymentMethod"), f.paymentMethod()));
            }
            if (f.paymentStatus() != null) {
                ps.add(cb.equal(root.get("paymentStatus"), f.paymentStatus()));
            }
            if (f.from() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("placedAt"), f.from()));
            }
            if (f.to() != null) {
                ps.add(cb.lessThan(root.get("placedAt"), f.to()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                String q = f.q().trim();
                if (q.replaceAll("[\\s.+-]", "").matches("\\d{9,12}")) {
                    ps.add(cb.equal(root.get("shippingAddress").get("recipientPhone"), PhoneNumber.of(q)));
                } else {
                    ps.add(cb.like(root.get("orderCode"), "%" + q.toUpperCase().replace("%", "") + "%"));
                }
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(Math.max(f.page(), 0), Math.clamp(f.size(), 1, 100),
                Sort.by(Sort.Order.desc("placedAt")));
        return orders.findAll(spec, pageable).map(mapper);
    }

    @Transactional(readOnly = true)
    public <T> T get(UUID id, Function<Order, T> mapper) {
        return mapper.apply(load(id));
    }

    @Transactional
    public <T> T markPaid(UUID id, String paymentRef, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        o.markPaid(paymentRef, adminId, clock.instant());
        audit.log("ordering", "Order", o.getOrderCode(), "ORDER_PAID", adminId, o.getTotal().amount(),
                "{\"paymentRef\":\"" + jsonSafe(o.getPaymentRef()) + "\"}");
        return mapper.apply(orders.save(o));
    }

    @Transactional
    public <T> T confirm(UUID id, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        o.confirm(adminId, clock.instant());
        return mapper.apply(orders.save(o));
    }

    @Transactional
    public <T> T ship(UUID id, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        o.markShipping(adminId, clock.instant());
        shipping.createShipment(o.getOrderCode(), o.getShippingAddress());
        return mapper.apply(orders.save(o));
    }

    @Transactional
    public <T> T deliver(UUID id, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        o.markDelivered(adminId, clock.instant());
        return mapper.apply(orders.save(o));
    }

    @Transactional
    public <T> T returnOrder(UUID id, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        o.markReturned(adminId, props.returnWindow(), clock.instant());
        audit.log("ordering", "Order", o.getOrderCode(), "ORDER_RETURNED", adminId, o.getTotal().amount(), null);
        return mapper.apply(orders.save(o));
    }

    @Transactional
    public <T> T cancel(UUID id, String reason, UUID adminId, Function<Order, T> mapper) {
        Order o = load(id);
        CancelReason r;
        try {
            r = reason == null ? CancelReason.ADMIN : CancelReason.valueOf(reason);
        } catch (IllegalArgumentException e) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CANCEL_REASON_INVALID);
        }
        o.cancel(r, adminId, false, clock.instant());
        return mapper.apply(orders.save(o));
    }

    private Order load(UUID id) {
        return orders.findById(id).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.ORDER_NOT_FOUND));
    }

    private static String jsonSafe(String s) {
        return s == null ? "" : s.replace("\\", "").replace("\"", "");
    }
}
