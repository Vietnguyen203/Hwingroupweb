package com.vietnl.hwin.affiliate.service.job;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.notification.NotificationService;
import com.vietnl.hwin.common.notification.NotificationType;

/**
 * Job mỗi giờ: hoa hồng PENDING đã tới mốc (đơn giao + hold-days) -> APPROVED, cộng vào số dư.
 * Mỗi hoa hồng một transaction (lỗi một bản ghi không ảnh hưởng bản ghi khác).
 */
@Component
public class CommissionApprovalJob {

    private static final Logger log = LoggerFactory.getLogger(CommissionApprovalJob.class);

    private final CommissionRepository commissions;
    private final AuditLogger audit;
    private final AffiliateRepository affiliates;
    private final NotificationService notifications;
    private final TransactionTemplate tx;
    private final Clock clock;

    public CommissionApprovalJob(CommissionRepository commissions, AuditLogger audit, AffiliateRepository affiliates,
                                 NotificationService notifications, TransactionTemplate tx, Clock clock) {
        this.commissions = commissions;
        this.audit = audit;
        this.affiliates = affiliates;
        this.notifications = notifications;
        this.tx = tx;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.affiliate.approval-cron:0 10 * * * *}")
    public void run() {
        approveDue(clock.instant());
    }

    /** @return số hoa hồng được duyệt (dùng cho job và cho admin chạy thủ công với thời điểm giả lập ở dev) */
    public int approveDue(Instant now) {
        int total = 0;
        List<UUID> ids;
        do {
            ids = commissions.findDueIds(CommissionStatus.PENDING, now, PageRequest.of(0, 100));
            for (UUID id : ids) {
                Boolean ok = tx.execute(s -> commissions.findById(id).filter(c -> c.isDue(now)).map(c -> {
                    c.approve(now);
                    commissions.save(c);
                    audit.log("affiliate", "Commission", c.getId(), "COMMISSION_APPROVED", null, c.getAmount().amount(),
                            "{\"orderCode\":\"" + c.getOrderCode() + "\"}");
                    affiliates.findById(c.getAffiliateId()).ifPresent(a -> notifications.notifyUser(a.getUserId(),
                            NotificationType.COMMISSION_APPROVED,
                            Map.of("orderCode", c.getOrderCode(), "amount", c.getAmount().amount()), "/affiliate",
                            "commission-approved:" + c.getId()));
                    return true;
                }).orElse(false));
                if (Boolean.TRUE.equals(ok)) {
                    total++;
                }
            }
        } while (ids.size() == 100);
        if (total > 0) {
            log.info("Đã duyệt {} hoa hồng", total);
        }
        return total;
    }
}
