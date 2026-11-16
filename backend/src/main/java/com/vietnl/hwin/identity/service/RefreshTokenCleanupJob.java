package com.vietnl.hwin.identity.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.identity.repository.RefreshTokenRepository;

/**
 * Job hằng ngày 3h sáng: xóa refresh token đã hết hạn hoặc đã thu hồi quá 7 ngày
 * (giữ lại 7 ngày để còn phát hiện token cũ bị dùng lại).
 */
@Component
public class RefreshTokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupJob.class);
    static final Duration KEEP = Duration.ofDays(7);

    private final RefreshTokenRepository tokens;
    private final Clock clock;

    public RefreshTokenCleanupJob(RefreshTokenRepository tokens, Clock clock) {
        this.tokens = tokens;
        this.clock = clock;
    }

    @Scheduled(cron = "${hwin.cleanup.refresh-token-cron:0 0 3 * * *}")
    @Transactional
    public int run() {
        Instant cutoff = clock.instant().minus(KEEP);
        int deleted = tokens.deleteStale(cutoff);
        if (deleted > 0) {
            log.info("Đã xóa {} refresh token hết hạn / đã thu hồi", deleted);
        }
        return deleted;
    }
}
