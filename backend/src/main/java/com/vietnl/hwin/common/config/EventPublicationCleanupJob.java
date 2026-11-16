package com.vietnl.hwin.common.config;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Job hằng ngày 3h15: xóa event nội bộ (Spring Modulith) đã xử lý xong quá 7 ngày.
 * Event chưa xử lý xong được giữ nguyên để phát lại khi khởi động.
 */
@Component
public class EventPublicationCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(EventPublicationCleanupJob.class);
    static final Duration KEEP_COMPLETED = Duration.ofDays(7);

    private final CompletedEventPublications completed;

    public EventPublicationCleanupJob(CompletedEventPublications completed) {
        this.completed = completed;
    }

    @Scheduled(cron = "${hwin.cleanup.event-cron:0 15 3 * * *}")
    public void run() {
        completed.deletePublicationsOlderThan(KEEP_COMPLETED);
        log.info("Đã dọn event nội bộ đã xử lý quá {} ngày", KEEP_COMPLETED.toDays());
    }
}
