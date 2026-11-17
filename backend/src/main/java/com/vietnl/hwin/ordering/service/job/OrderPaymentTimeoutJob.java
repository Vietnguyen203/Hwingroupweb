package com.vietnl.hwin.ordering.service.job;

import com.vietnl.hwin.ordering.service.config.OrderingProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Job mỗi 15 phút: đơn chuyển khoản (BANK_QR) còn PENDING + chưa nhận tiền quá hạn
 * (hwin.ordering.bank-qr-payment-timeout-hours, mặc định 24 giờ) -> hệ thống hủy với lý do PAYMENT_TIMEOUT.
 * Event OrderCancelled sẽ hoàn kho + hủy hoa hồng + trừ thống kê như mọi đơn hủy khác.
 */
@Component
public class OrderPaymentTimeoutJob {

    private static final Logger log = LoggerFactory.getLogger(OrderPaymentTimeoutJob.class);

    private final OrderRepository orders;
    private final OrderingProperties props;
    private final TransactionTemplate tx;
    private final Clock clock;

    public OrderPaymentTimeoutJob(OrderRepository orders, OrderingProperties props, TransactionTemplate tx, Clock clock) {
        this.orders = orders;
        this.props = props;
        this.tx = tx;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.ordering.payment-timeout-cron:0 */15 * * * *}")
    public void run() {
        cancelOverdue(clock.instant());
    }

    /** @return số đơn bị hủy (dùng cho job và cho admin chạy thủ công với thời điểm giả lập ở dev) */
    public int cancelOverdue(Instant now) {
        Instant placedBefore = now.minus(props.bankQrPaymentTimeout());
        int total = 0;
        List<UUID> ids;
        do {
            ids = orders.findUnpaidBankQrBefore(placedBefore, PageRequest.of(0, 100));
            for (UUID id : ids) {
                Boolean ok = tx.execute(s -> orders.findById(id)
                        .filter(o -> o.getStatus() == OrderStatus.PENDING && o.isAwaitingTransfer())
                        .map(o -> {
                            o.cancel(CancelReason.PAYMENT_TIMEOUT, null, false, now);
                            orders.save(o);
                            return true;
                        }).orElse(false));
                if (Boolean.TRUE.equals(ok)) {
                    total++;
                }
            }
        } while (ids.size() == 100);
        if (total > 0) {
            log.info("Đã hủy {} đơn chuyển khoản quá hạn thanh toán", total);
        }
        return total;
    }
}
