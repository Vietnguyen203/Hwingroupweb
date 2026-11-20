package com.vietnl.hwin.identity.service.integration;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.config.OtpProperties;

/**
 * Gửi OTP qua email (SMTP – biến MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM).
 * Dev: Mailpit, xem thư tại http://localhost:18025.
 * Thư được gửi NỀN (luồng ảo): kết nối SMTP (Gmail: TLS + đăng nhập) mất vài giây, không để người dùng chờ ở bước gửi OTP –
 * họ sang bước nhập mã ngay, thư đến sau. Lỗi gửi chỉ ghi log; mã vẫn hợp lệ và người dùng có thể bấm gửi lại.
 * Không cấu hình SMTP (MAIL_HOST trống):
 * - dev/test (log-code=true): chỉ log, mã lấy từ log / hộp thư dev;
 * - môi trường thật: backend từ chối khởi động (không thì không ai nhận được OTP).
 * Địa chỉ ở tên miền dành riêng (RFC 2606: example.com/net/org, .test, .example, .invalid, .localhost) KHÔNG bao giờ gửi thật:
 * chỉ log. Postman và các lần thử dùng địa chỉ kiểu này; gửi thật chỉ tạo thư báo lỗi (bounce) về hộp thư SMTP của người dùng.
 */
@Component
public class EmailOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpSender.class);

    private final JavaMailSender mailSender;
    private final OtpProperties props;
    private final String from;
    private final Executor executor;

    @Autowired
    public EmailOtpSender(ObjectProvider<JavaMailSender> mailSender, OtpProperties props,
                          @Value("${spring.mail.host:}") String host,
                          @Value("${hwin.mail.from:Hwin Food <no-reply@hwin.vn>}") String from) {
        this(mailSender, props, host, from, Executors.newVirtualThreadPerTaskExecutor());
    }

    /** Cho test: truyền Executor để điều khiển nơi gửi thư (vd Runnable::run = gửi ngay trong luồng gọi). */
    EmailOtpSender(ObjectProvider<JavaMailSender> mailSender, OtpProperties props, String host, String from, Executor executor) {
        this.mailSender = host.isBlank() ? null : mailSender.getIfAvailable();
        this.props = props;
        this.from = from;
        this.executor = executor;
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
        if (isReservedDomain(destination)) {
            log.info("[Email giả lập – tên miền dành riêng, không gửi thật] {} tới {}", purpose, masked);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(destination);
        msg.setSubject("Mã xác thực Phúc Vị Foods: " + code);
        msg.setText("""
                Mã xác thực của bạn là: %s

                Mục đích: %s
                Mã có hiệu lực %d phút. Không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Phúc Vị Foods.
                Nếu bạn không yêu cầu mã, hãy bỏ qua email này.
                """.formatted(code, purposeText(purpose), props.ttl().toMinutes()));
        executor.execute(() -> {
            try {
                mailSender.send(msg);
                log.info("Đã gửi OTP {} tới {}", purpose, masked);
            } catch (MailException e) {
                log.warn("Gửi email OTP tới {} thất bại: {}", masked, e.getMessage());
            }
        });
    }

    /** Tên miền dành riêng theo RFC 2606 / 6761: không có hộp thư thật, gửi tới chỉ tạo thư báo lỗi. */
    static boolean isReservedDomain(String email) {
        int at = email == null ? -1 : email.lastIndexOf('@');
        if (at < 0) {
            return false;
        }
        String domain = email.substring(at + 1).trim().toLowerCase();
        for (String reserved : RESERVED_DOMAINS) {
            if (domain.equals(reserved) || domain.endsWith("." + reserved)) {
                return true;
            }
        }
        return false;
    }

    private static final java.util.List<String> RESERVED_DOMAINS =
            java.util.List.of("example.com", "example.net", "example.org", "example", "test", "invalid", "localhost");

    private static String purposeText(OtpPurpose purpose) {
        return switch (purpose) {
            case LOGIN -> "đăng nhập";
            case REGISTER -> "đăng ký tài khoản";
            case ADD_PHONE -> "thêm số điện thoại";
            case BANK_CHANGE -> "đổi tài khoản ngân hàng nhận hoa hồng";
            case ADMIN_LOGIN -> "đăng nhập trang quản trị";
        };
    }
}
