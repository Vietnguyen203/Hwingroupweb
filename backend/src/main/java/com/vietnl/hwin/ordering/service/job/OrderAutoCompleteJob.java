package com.vietnl.hwin.ordering.service.job;

import com.vietnl.hwin.ordering.service.config.OrderingProperties;
import java.util.UUID;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Job mỗi giờ: đơn DELIVERED đã quá hạn đổi trả -> COMPLETED. Mỗi đơn một transaction.
 */
@Component
public class OrderAutoCompleteJob {

    private static final Logger log = LoggerFactory.getLogger(OrderAutoCompleteJob.class);

    private final OrderRepository orders;
    private final OrderingProperties props;
    private final TransactionTemplate tx;
    private final Clock clock;

    public OrderAutoCompleteJob(OrderRepository orders, OrderingProperties props, TransactionTemplate tx, Clock clock) {
        this.orders = orders;
        this.props = props;
        this.tx = tx;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.ordering.auto-complete-cron:0 5 * * * *}")
    public void run() {
        Instant now = clock.instant();
        List<UUID> ids = orders.findDeliveredBefore(now.minus(props.returnWindow()), PageRequest.of(0, 200));
        for (UUID id : ids) {
            tx.executeWithoutResult(s -> orders.findById(id).ifPresent(o -> {
                o.complete(props.returnWindow(), now);
                orders.save(o);
            }));
        }
        if (!ids.isEmpty()) {
            log.info("Đã hoàn tất {} đơn hết hạn đổi trả", ids.size());
        }
    }
}
