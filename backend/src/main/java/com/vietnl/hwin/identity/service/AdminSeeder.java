package com.vietnl.hwin.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Tạo admin đầu tiên từ cấu hình hwin.admin-seed (biến môi trường ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_PHONE).
 * <ul>
 *   <li><b>Profile dev</b>: mặc định tạo tài khoản {@code admin}/{@code admin} MIỄN OTP (otp-exempt=true).</li>
 *   <li><b>Môi trường khác</b>: TỪ CHỐI KHỞI ĐỘNG nếu bật miễn OTP, mật khẩu yếu, thiếu SĐT nhận OTP,
 *       hoặc trong DB còn tài khoản miễn OTP (ví dụ DB dev bị mang lên server).</li>
 * </ul>
 */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties props;
    private final Environment env;

    public AdminSeeder(UserAccountRepository users, PasswordEncoder passwordEncoder, AdminSeedProperties props,
                       Environment env) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
        this.env = env;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean dev = env.acceptsProfiles(Profiles.of("dev"));
        if (!dev && users.existsByOtpExemptTrue()) {
            throw new IllegalStateException("Có tài khoản miễn OTP (otp_exempt=true) – chỉ được phép ở profile dev. "
                    + "Hãy tắt cờ này trong DB trước khi chạy môi trường thật.");
        }
        if (isBlank(props.email()) || isBlank(props.password())) {
            log.warn("Chưa cấu hình ADMIN_EMAIL / ADMIN_PASSWORD – bỏ qua tạo admin");
            return;
        }
        if (props.otpExempt() && !dev) {
            throw new IllegalStateException("hwin.admin-seed.otp-exempt=true chỉ dùng ở profile dev");
        }
        String login = props.email().trim().toLowerCase();
        UserAccount existing = users.findByEmail(login).orElse(null);
        if (existing != null) {
            if (dev && props.otpExempt() && !existing.isOtpExempt()) {
                existing.markDevOtpExempt();
                log.info("Tài khoản dev {} được miễn OTP", login);
            }
            return;
        }
        UserAccount admin;
        if (props.otpExempt()) {
            admin = UserAccount.createDevAdmin(login, passwordEncoder.encode(props.password()), props.fullName());
            log.warn("Đã tạo tài khoản DEV {} – MIỄN OTP, chỉ dùng cho môi trường phát triển", login);
        } else {
            try {
                PasswordPolicy.validate(props.password(), login);
            } catch (DomainException e) {
                throw new IllegalStateException("ADMIN_PASSWORD không đạt yêu cầu: " + e.getMessage(), e);
            }
            if (isBlank(props.phone())) {
                throw new IllegalStateException("Thiếu ADMIN_PHONE – admin cần số điện thoại để nhận OTP đăng nhập");
            }
            admin = UserAccount.createAdmin(login, passwordEncoder.encode(props.password()), props.fullName(),
                    PhoneNumber.of(props.phone()));
            log.info("Đã tạo tài khoản admin {} (đăng nhập mật khẩu + OTP)", login);
        }
        users.save(admin);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /**
     * @param otpExempt chỉ được true ở profile dev (tài khoản admin/admin)
     */
    @ConfigurationProperties(prefix = "hwin.admin-seed")
    public record AdminSeedProperties(String email, String password, String fullName, String phone, boolean otpExempt) {
    }
}
