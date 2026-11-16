package com.vietnl.hwin.common.ratelimit;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.exception.TooManyRequestsException;

/**
 * Giới hạn tần suất kiểu fixed window bằng Redis INCR + EXPIRE.
 */
@Component
public class RateLimiter {

    private final StringRedisTemplate redis;

    public RateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** @return true nếu còn trong hạn mức. */
    public boolean tryAcquire(String key, int limit, Duration window) {
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, window);
        }
        return count != null && count <= limit;
    }

    /** true nếu bộ đếm của key đã chạm ngưỡng (không tăng bộ đếm). */
    public boolean isExhausted(String key, int limit) {
        String v = redis.opsForValue().get(key);
        return v != null && Long.parseLong(v) >= limit;
    }

    /** Tăng bộ đếm (ví dụ chỉ khi đăng nhập sai). */
    public void hit(String key, Duration window) {
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, window);
        }
    }

    public void acquireOrThrow(String key, int limit, Duration window, String message) {
        if (!tryAcquire(key, limit, window)) {
            throw new TooManyRequestsException("RATE_LIMITED", message);
        }
    }
}
