package com.vietnl.hwin.identity.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.OtpProperties;

/**
 * Implementation giả: chỉ in OTP ra log khi hwin.otp.log-code=true (profile dev).
 * Ở profile khác chỉ log SĐT đã che, KHÔNG log mã.
 */
@Component
public class LogOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(LogOtpSender.class);

    private final OtpProperties props;
    private final DevOtpInbox devInbox;

    public LogOtpSender(OtpProperties props, DevOtpInbox devInbox) {
        this.props = props;
        this.devInbox = devInbox;
    }

    @Override
    public void send(PhoneNumber phone, String code, OtpPurpose purpose) {
        if (props.logCode()) {
            log.info("[DEV OTP] {} {} -> {}", purpose, phone.masked(), code);
            devInbox.put(phone, purpose, code);
        } else {
            log.info("Đã gửi OTP {} tới {}", purpose, phone.masked());
        }
    }
}
