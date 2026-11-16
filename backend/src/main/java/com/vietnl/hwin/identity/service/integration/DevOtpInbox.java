package com.vietnl.hwin.identity.service.integration;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.OtpProperties;

/**
 * "Hộp thư" OTP trong bộ nhớ – CHỈ ghi khi hwin.otp.log-code=true (profile dev), để Postman / test tự động
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

    void put(PhoneNumber phone, OtpPurpose purpose, String code) {
        if (props.logCode()) {
            inbox.put(key(phone, purpose), new Entry(code, clock.instant().plus(props.ttl())));
        }
    }

    public Optional<String> latest(PhoneNumber phone, OtpPurpose purpose) {
        Entry e = inbox.get(key(phone, purpose));
        return e == null || clock.instant().isAfter(e.expiresAt()) ? Optional.empty() : Optional.of(e.code());
    }

    private static String key(PhoneNumber phone, OtpPurpose purpose) {
        return purpose + ":" + phone.value();
    }
}
