package com.vietnl.hwin.common.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Mỗi ngày xóa thông báo cũ: đã đọc quá 30 ngày hoặc bất kỳ thông báo nào quá 90 ngày. */
@Component
class NotificationCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(NotificationCleanupJob.class);

    private final NotificationService notifications;

    NotificationCleanupJob(NotificationService notifications) {
        this.notifications = notifications;
    }

    @Scheduled(cron = "${hwin.notification.cleanup-cron:0 20 3 * * *}")
    void run() {
        int n = notifications.purge(30, 90);
        if (n > 0) {
            log.info("Deleted {} old notifications", n);
        }
    }
}
