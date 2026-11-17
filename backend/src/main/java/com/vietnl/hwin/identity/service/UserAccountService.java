package com.vietnl.hwin.identity.service;

import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.vietnl.hwin.identity.entity.CitizenId;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.event.UserPhoneAddedEvent;
import com.vietnl.hwin.identity.service.integration.PiiCrypto;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;
import com.vietnl.hwin.identity.service.model.SendOtpResult;

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

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PiiCrypto pii;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    /** Gửi OTP tới SĐT muốn thêm (SĐT chưa thuộc tài khoản nào). */
    public SendOtpResult requestAddPhoneOtp(UUID userId, String rawPhone, String ipHash) {
        PhoneNumber phone = PhoneNumber.of(rawPhone);
        if (get(userId).getPhone() != null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_ALREADY_SET);
        }
        if (users.findByPhone(phone).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_IN_USE);
        }
        OtpTarget target = OtpTarget.phone(phone);
        long ttl = otpService.send(target, OtpPurpose.ADD_PHONE, ipHash);
        return new SendOtpResult(target.channel(), target.masked(), ttl);
    }

    /** Xác minh OTP rồi gắn SĐT vào tài khoản; phát UserPhoneAddedEvent cho module customer. */
    @Transactional
    public UserAccount addPhone(UUID userId, String rawPhone, String otp) {
        PhoneNumber phone = PhoneNumber.of(rawPhone);
        otpService.verify(OtpTarget.phone(phone), OtpPurpose.ADD_PHONE, otp);
        if (users.findByPhone(phone).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_IN_USE);
        }
        UserAccount user = get(userId);
        user.addPhone(phone);
        events.publishEvent(UserPhoneAddedEvent.of(userId, phone.value(), clock.instant()));
        log.info("Tài khoản {} thêm SĐT {}", userId, phone.masked());
        return user;
    }

    public UserAccountService(UserAccountRepository users, ApplicationEventPublisher events, Clock clock, PiiCrypto pii,
                              PasswordEncoder passwordEncoder, OtpService otpService) {
        this.pii = pii;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
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

    /**
     * Đăng ký tài khoản khách MỚI (đủ thông tin + mật khẩu); trùng SĐT / email / CCCD thì báo lỗi.
     * Phát UserRegisteredEvent để module customer tạo hồ sơ.
     */
    @Transactional
    public UserAccount register(OtpTarget target, RegisterAccountCommand cmd) {
        if (find(target).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_EXISTS);
        }
        CitizenId cid = CitizenId.of(cmd.citizenId());
        String cidHash = pii.hash(cid);
        if (users.existsByCitizenIdHash(cidHash)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CITIZEN_ID_IN_USE);
        }
        PasswordPolicy.validateCustomer(cmd.password(), target.value());
        Instant now = clock.instant();
        boolean sms = target.channel() == OtpChannel.SMS;
        UserAccount user = UserAccount.registerCustomer(
                sms ? new PhoneNumber(target.value()) : null, sms ? null : new EmailAddress(target.value()),
                cmd.fullName(), cmd.dateOfBirth(), cmd.address(), pii.encrypt(cid), cidHash, cid.last4(),
                passwordEncoder.encode(cmd.password()), LocalDate.ofInstant(now, VN));
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
