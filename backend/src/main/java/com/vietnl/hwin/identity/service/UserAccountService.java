package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.entity.event.UserRegisteredEvent;
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

    /** Tài khoản khách / CTV theo SĐT hoặc email. */
    @Transactional(readOnly = true)
    public java.util.Optional<UserAccount> find(OtpTarget target) {
        return target.channel() == OtpChannel.SMS
                ? users.findByPhone(new PhoneNumber(target.value()))
                : users.findByEmail(target.value());
    }

    /** Đăng nhập tài khoản ĐÃ CÓ (không tự tạo). */
    @Transactional
    public UserAccount login(OtpTarget target) {
        UserAccount user = find(target).orElseThrow(() -> new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_NOT_FOUND));
        ensureNotAdmin(user);
        user.recordLogin(clock.instant());
        return user;
    }

    /** Đăng ký tài khoản khách MỚI; đã có thì báo lỗi. Phát UserRegisteredEvent để module customer tạo hồ sơ. */
    @Transactional
    public UserAccount register(OtpTarget target, String fullName) {
        if (find(target).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_EXISTS);
        }
        Instant now = clock.instant();
        boolean sms = target.channel() == OtpChannel.SMS;
        UserAccount user = sms ? UserAccount.registerCustomer(new PhoneNumber(target.value()))
                : UserAccount.registerCustomer(new EmailAddress(target.value()));
        user.rename(fullName);
        user = users.save(user);
        events.publishEvent(UserRegisteredEvent.of(user.getId(), sms ? target.value() : null, sms ? null : target.value(), now));
        user.recordLogin(now);
        log.info("Đăng ký tài khoản mới {}", target.masked());
        return user;
    }

    /**
     * Dùng cho test / dữ liệu mẫu: tìm theo SĐT, chưa có thì tạo (CUSTOMER) và phát UserRegisteredEvent.
     * Luồng thật dùng {@link #login} / {@link #register}.
     * Đồng thời ghi nhận lần đăng nhập.
     */
    @Transactional
    public UserAccount loginByPhone(PhoneNumber phone) {
        Instant now = clock.instant();
        UserAccount user = users.findByPhone(phone).orElse(null);
        ensureNotAdmin(user);
        if (user == null) {
            user = users.save(UserAccount.registerCustomer(phone));
            events.publishEvent(UserRegisteredEvent.of(user.getId(), phone.value(), null, now));
            log.info("Tạo tài khoản mới cho {}", phone.masked());
        }
        user.recordLogin(now);
        return user;
    }

    /** Như {@link #loginByPhone} nhưng định danh bằng email. */
    @Transactional
    public UserAccount loginByEmail(EmailAddress email) {
        Instant now = clock.instant();
        UserAccount user = users.findByEmail(email.value()).orElse(null);
        ensureNotAdmin(user);
        if (user == null) {
            user = users.save(UserAccount.registerCustomer(email));
            events.publishEvent(UserRegisteredEvent.of(user.getId(), null, email.value(), now));
            log.info("Tạo tài khoản mới cho {}", email.masked());
        }
        user.recordLogin(now);
        return user;
    }

    /** Không cho tài khoản quản trị vào bằng OTP khách (bỏ qua bước mật khẩu). */
    private static void ensureNotAdmin(UserAccount user) {
        if (user != null && user.isAdmin()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADMIN_USE_ADMIN_LOGIN);
        }
    }

    @Transactional
    public void recordLogin(UUID userId) {
        get(userId).recordLogin(clock.instant());
    }

    @Transactional(readOnly = true)
    public UserAccount get(UUID userId) {
        return users.findById(userId).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.USER_NOT_FOUND));
    }
}
