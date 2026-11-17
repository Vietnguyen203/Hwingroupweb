package com.vietnl.hwin.identity.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.config.OtpProperties;

/**
 * SMS GIẢ LẬP: không gửi tin nhắn thật. Chỉ dùng được khi hwin.otp.log-code=true (dev/test) –
 * mã đã được OtpService in ra log và lưu vào hộp thư dev.
 * Môi trường thật: available() = false -> người dùng được báo dùng email.
 * Kế hoạch thay bằng SMS brandname: docs/08-otp.md.
 */
@Component
public class SimulatedSmsOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(SimulatedSmsOtpSender.class);

    private final OtpProperties props;

    public SimulatedSmsOtpSender(OtpProperties props) {
        this.props = props;
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.SMS;
    }

    @Override
    public boolean available() {
        return props.logCode();
    }

    @Override
    public void send(String destination, String code, OtpPurpose purpose) {
        log.info("[SMS giả lập] {} tới {}", purpose, new PhoneNumber(destination).masked());
    }
}
