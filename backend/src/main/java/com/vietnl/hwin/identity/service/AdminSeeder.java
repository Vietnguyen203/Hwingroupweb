package com.vietnl.hwin.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Tạo admin đầu tiên từ biến môi trường ADMIN_EMAIL / ADMIN_PASSWORD (nếu chưa tồn tại).
 */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties props;

    public AdminSeeder(UserAccountRepository users, PasswordEncoder passwordEncoder, AdminSeedProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (props.email() == null || props.email().isBlank() || props.password() == null || props.password().isBlank()) {
            log.warn("Chưa cấu hình ADMIN_EMAIL/ADMIN_PASSWORD – bỏ qua seed admin");
            return;
        }
        String email = props.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            return;
        }
        users.save(UserAccount.createAdmin(email, passwordEncoder.encode(props.password()), props.fullName()));
        log.info("Đã tạo tài khoản admin {}", email);
    }

    @ConfigurationProperties(prefix = "hwin.admin-seed")
    public record AdminSeedProperties(String email, String password, String fullName) {
    }
}
