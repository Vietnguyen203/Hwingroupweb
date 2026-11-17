package com.vietnl.hwin.customer.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.customer.entity.CustomerProductStat;
import com.vietnl.hwin.customer.entity.CustomerStats;
import com.vietnl.hwin.customer.repository.CustomerProductStatRepository;
import com.vietnl.hwin.customer.repository.CustomerStatsRepository;
import com.vietnl.hwin.ordering.entity.OrderCancelled;
import com.vietnl.hwin.ordering.entity.OrderItemSnapshot;
import com.vietnl.hwin.ordering.entity.OrderPlaced;
import com.vietnl.hwin.ordering.entity.OrderReturned;

/**
 * Cập nhật read model thống kê khách từ event của ordering.
 * Idempotent: mỗi (eventId, listener) chỉ xử lý một lần (bảng processed_event).
 */
@Component
public class CustomerStatsListener {

    private static final String NAME = "CustomerStatsListener";

    private final CustomerStatsRepository stats;
    private final CustomerProductStatRepository productStats;
    private final CustomerService customerService;
    private final Clock clock;

    public CustomerStatsListener(CustomerStatsRepository stats, CustomerProductStatRepository productStats,
                                 CustomerService customerService, Clock clock) {
        this.stats = stats;
        this.productStats = productStats;
        this.customerService = customerService;
        this.clock = clock;
    }

    @ApplicationModuleListener
    void on(OrderPlaced e) {
        if (!firstTime(e.eventId())) {
            return;
        }
        customerService.ensureCustomer(e.customerId());
        CustomerStats s = load(e.customerId());
        s.onOrderPlaced(e.total(), e.occurredAt());
        stats.save(s);
        for (OrderItemSnapshot i : e.items()) {
            var key = new CustomerProductStat.Key(e.customerId(), i.productId());
            CustomerProductStat ps = productStats.findById(key)
                    .orElseGet(() -> CustomerProductStat.start(e.customerId(), i.productId()));
            ps.add(i.quantity(), e.occurredAt());
            productStats.save(ps);
        }
    }

    @ApplicationModuleListener
    void on(OrderCancelled e) {
        voided(e.eventId(), e.customerId(), e.total(), e.items(), e.occurredAt());
    }

    @ApplicationModuleListener
    void on(OrderReturned e) {
        voided(e.eventId(), e.customerId(), e.total(), e.items(), e.occurredAt());
    }

    private void voided(UUID eventId, UUID customerId, long total, List<OrderItemSnapshot> items, Instant at) {
        if (!firstTime(eventId)) {
            return;
        }
        stats.findById(customerId).ifPresent(s -> {
            s.onOrderVoided(total, at);
            stats.save(s);
        });
        for (OrderItemSnapshot i : items) {
            productStats.findById(new CustomerProductStat.Key(customerId, i.productId())).ifPresent(ps -> {
                ps.subtract(i.quantity());
                productStats.save(ps);
            });
        }
    }

    private CustomerStats load(UUID customerId) {
        return stats.findById(customerId).orElseGet(() -> CustomerStats.empty(customerId, clock.instant()));
    }

    private boolean firstTime(UUID eventId) {
        return stats.markProcessed(eventId, NAME) == 1;
    }
}
