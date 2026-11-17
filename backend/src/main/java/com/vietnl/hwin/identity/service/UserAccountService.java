package com.vietnl.hwin.identity.service;

import java.util.UUID;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.entity.UserRegistered;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/** Use case nội bộ trên aggregate UserAccount. */
@Service
public class UserAccountService {

    private static final Logger log = LoggerFactory.getLogger(UserAccountService.class);

    private final UserAccountRepository users;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public UserAccountService(UserAccountRepository users, ApplicationEventPublisher events, Clock clock) {
        this.users = users;
        this.events = events;
        this.clock = clock;
    }

    /**
     * Tìm tài khoản theo SĐT, chưa có thì tạo mới (CUSTOMER) và phát UserRegistered.
     * Đồng thời ghi nhận lần đăng nhập.
     */
    @Transactional
    public UserAccount loginByPhone(PhoneNumber phone) {
        Instant now = clock.instant();
        UserAccount user = users.findByPhone(phone).orElse(null);
        if (user != null && user.isAdmin()) {
            // Không cho tài khoản quản trị vào bằng OTP khách (bỏ qua bước mật khẩu)
            throw new DomainException("ADMIN_USE_ADMIN_LOGIN", "Tài khoản quản trị phải đăng nhập tại trang quản trị");
        }
        if (user == null) {
            user = users.save(UserAccount.registerCustomer(phone));
            events.publishEvent(UserRegistered.of(user.getId(), phone.value(), now));
            log.info("Tạo tài khoản mới cho {}", phone.masked());
        }
        user.recordLogin(now);
        return user;
    }

    @Transactional
    public void recordLogin(UUID userId) {
        get(userId).recordLogin(clock.instant());
    }

    @Transactional(readOnly = true)
    public UserAccount get(UUID userId) {
        return users.findById(userId).orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
    }
}
