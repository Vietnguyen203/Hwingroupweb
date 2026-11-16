package com.vietnl.hwin.customer.service;

import java.time.Clock;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.customer.repository.CustomerStatsRepository;

/**
 * Job hằng ngày 3h20: xóa dấu "event đã xử lý" quá 30 ngày (event cũ hơn không còn bị phát lại).
 */
@Component
public class ProcessedEventCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(ProcessedEventCleanupJob.class);
    static final Duration KEEP = Duration.ofDays(30);

    private final CustomerStatsRepository stats;
    private final Clock clock;

    public ProcessedEventCleanupJob(CustomerStatsRepository stats, Clock clock) {
        this.stats = stats;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.cleanup.processed-event-cron:0 20 3 * * *}")
    @Transactional
    public int run() {
        int deleted = stats.deleteProcessedBefore(clock.instant().minus(KEEP));
        if (deleted > 0) {
            log.info("Đã xóa {} dấu event đã xử lý", deleted);
        }
        return deleted;
    }
}
