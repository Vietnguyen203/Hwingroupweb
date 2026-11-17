package com.vietnl.hwin.identity.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.OtpProperties;

/**
 * Gửi OTP qua email (SMTP – biến MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM).
 * Dev: Mailpit, xem thư tại http://localhost:18025.
 * Không cấu hình SMTP (MAIL_HOST trống):
 * - dev/test (log-code=true): chỉ log, mã lấy từ log / hộp thư dev;
 * - môi trường thật: backend từ chối khởi động (không thì không ai nhận được OTP).
 */
@Component
public class EmailOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpSender.class);

    private final JavaMailSender mailSender;
    private final OtpProperties props;
    private final String from;

    public EmailOtpSender(ObjectProvider<JavaMailSender> mailSender, OtpProperties props,
                          @Value("${spring.mail.host:}") String host,
                          @Value("${hwin.mail.from:Hwin Food <no-reply@hwin.vn>}") String from) {
        this.mailSender = host.isBlank() ? null : mailSender.getIfAvailable();
        this.props = props;
        this.from = from;
        if (this.mailSender == null && !props.logCode()) {
            throw new IllegalStateException("Chưa cấu hình SMTP (MAIL_HOST) để gửi OTP qua email");
        }
    }

    @Override
    public OtpChannel channel() {
        return OtpChannel.EMAIL;
    }

    @Override
    public void send(String destination, String code, OtpPurpose purpose) {
        String masked = new EmailAddress(destination).masked();
        if (mailSender == null) {
            log.info("[Email giả lập – chưa cấu hình SMTP] {} tới {}", purpose, masked);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(destination);
        msg.setSubject("Mã xác thực Hwin Food: " + code);
        msg.setText("""
                Mã xác thực của bạn là: %s

                Mục đích: %s
                Mã có hiệu lực %d phút. Không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Hwin Food.
                Nếu bạn không yêu cầu mã, hãy bỏ qua email này.
                """.formatted(code, purposeText(purpose), props.ttl().toMinutes()));
        try {
            mailSender.send(msg);
            log.info("Đã gửi OTP {} tới {}", purpose, masked);
        } catch (MailException e) {
            log.warn("Gửi email OTP tới {} thất bại: {}", masked, e.getMessage());
            throw new DomainException("OTP_SEND_FAILED", "Không gửi được email, vui lòng thử lại sau");
        }
    }

    private static String purposeText(OtpPurpose purpose) {
        return switch (purpose) {
            case LOGIN -> "đăng nhập";
            case BANK_CHANGE -> "đổi tài khoản ngân hàng nhận hoa hồng";
            case ADMIN_LOGIN -> "đăng nhập trang quản trị";
        };
    }
}
