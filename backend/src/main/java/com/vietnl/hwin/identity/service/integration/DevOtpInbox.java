package com.vietnl.hwin.identity.service.integration;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.service.config.OtpProperties;

/**
 * "Hộp thư" OTP trong bộ nhớ – CHỈ ghi khi hwin.otp.log-code=true (profile dev/test), để Postman / test tự động
 * lấy mã thay vì đọc log. Ở profile khác không ghi gì và endpoint đọc (DevOtpController) không tồn tại.
 */
@Component
public class DevOtpInbox {

    private record Entry(String code, Instant expiresAt) {
    }

    private final Map<String, Entry> inbox = new ConcurrentHashMap<>();
    private final OtpProperties props;
    private final Clock clock;

    public DevOtpInbox(OtpProperties props, Clock clock) {
        this.props = props;
        this.clock = clock;
    }

    public void put(OtpTarget target, OtpPurpose purpose, String code) {
        if (props.logCode()) {
            inbox.put(key(target, purpose), new Entry(code, clock.instant().plus(props.ttl())));
        }
    }

    public Optional<String> latest(OtpTarget target, OtpPurpose purpose) {
        Entry e = inbox.get(key(target, purpose));
        return e == null || clock.instant().isAfter(e.expiresAt()) ? Optional.empty() : Optional.of(e.code());
    }

    private static String key(OtpTarget target, OtpPurpose purpose) {
        return purpose + ":" + target.key();
    }
}
