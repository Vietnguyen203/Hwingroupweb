package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.service.config.IdentityProperties;
import com.vietnl.hwin.identity.service.model.LoginResult;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;

import com.vietnl.hwin.identity.service.model.IssuedTokens;
import com.vietnl.hwin.identity.service.model.AdminLoginResult;
import com.vietnl.hwin.identity.service.model.SendOtpResult;
import com.vietnl.hwin.identity.entity.ExceptionMessage;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Duration;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Điều phối đăng nhập. Không @Transactional ở đây để mỗi bước là một transaction riêng
 * (tạo/cập nhật UserAccount, rồi cấp RefreshToken) – mỗi transaction chỉ sửa một aggregate.
 */
@Service
public class AuthService {

    private static final int ADMIN_LOGIN_LIMIT = 5;
    private static final int LOOKUP_LIMIT = 20;
    private static final String CHALLENGE_PREFIX = "admin-login-challenge:";
    private static final String LOGIN_CHALLENGE_PREFIX = "login-challenge:";
    private static final Duration ADMIN_LOGIN_WINDOW = Duration.ofMinutes(10);

    private final OtpService otpService;
    private final UserAccountService userAccountService;
    private final TokenService tokenService;
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    /** Hash giả cùng độ khó: so khớp với nó khi tài khoản không tồn tại / chưa có mật khẩu, để thời gian phản hồi không lộ gì. */
    private final String dummyPasswordHash;
    private final RateLimiter rateLimiter;
    private final StringRedisTemplate redis;
    private final TrustedDeviceService trustedDevices;
    private final IdentityProperties identity;

    public AuthService(OtpService otpService, UserAccountService userAccountService, TokenService tokenService,
                       UserAccountRepository users, PasswordEncoder passwordEncoder, RateLimiter rateLimiter,
                       StringRedisTemplate redis, TrustedDeviceService trustedDevices, IdentityProperties identity) {
        this.otpService = otpService;
        this.userAccountService = userAccountService;
        this.tokenService = tokenService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.dummyPasswordHash = passwordEncoder.encode(Hashing.randomToken(24));
        this.rateLimiter = rateLimiter;
        this.redis = redis;
        this.trustedDevices = trustedDevices;
        this.identity = identity;
    }

    /** Gửi OTP xác minh khi đăng ký (SĐT hoặc email chưa có tài khoản). */
    public SendOtpResult requestRegisterOtp(String rawPhone, String rawEmail, ClientInfo client) {
        OtpTarget target = OtpTarget.of(rawPhone, rawEmail);
        if (!rateLimiter.tryAcquire("rl:auth-lookup:" + client.ipHash(), LOOKUP_LIMIT, ADMIN_LOGIN_WINDOW)) {
            throw new ResponseException(HttpStatus.TOO_MANY_REQUESTS, CommonErrorMessage.RATE_LIMITED);
        }
        if (userAccountService.find(target).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_EXISTS);
        }
        long ttl = otpService.send(target, OtpPurpose.REGISTER, client.ipHash());
        return new SendOtpResult(target.channel(), target.masked(), ttl);
    }

    /** Đăng ký tài khoản mới bằng OTP rồi đăng nhập luôn. */
    public IssuedTokens registerWithOtp(String rawPhone, String rawEmail, String otp, RegisterAccountCommand cmd,
                                        ClientInfo client) {
        OtpTarget target = OtpTarget.of(rawPhone, rawEmail);
        otpService.verify(target, OtpPurpose.REGISTER, otp);
        return tokenService.issue(userAccountService.register(target, cmd), client);
    }

    /**
     * Đăng nhập khách / CTV: tên đăng nhập (email hoặc SĐT) + mật khẩu.
     * - Nếu otpOnLogin=false (mặc định) hoặc thiết bị đã ghi nhớ -> đăng nhập luôn không cần OTP.
     * - Nếu otpOnLogin=true (test) và thiết bị mới -> gửi OTP tới nơi nhận, trả challengeId cho bước 2.
     * Sai mật khẩu: tối đa 5 lần / 15 phút theo IP và theo tài khoản (không tiết lộ tài khoản có tồn tại không).
     */
    public LoginResult login(String identifier, String password, String trustedDeviceToken, ClientInfo client) {
        String trimmed = identifier == null ? "" : identifier.trim();
        String ipKey = "rl:login-fail:ip:" + client.ipHash();
        String accountKey = "rl:login-fail:acc:" + trimmed.toLowerCase();
        if (rateLimiter.isExhausted(ipKey, identity.loginFailLimit()) || rateLimiter.isExhausted(accountKey, identity.loginFailLimit())) {
            throw new ResponseException(HttpStatus.TOO_MANY_REQUESTS, ExceptionMessage.LOGIN_LOCKED,
                    java.util.Map.of("minutes", String.valueOf(identity.loginFailWindow().toMinutes())));
        }
        UserAccount user = users.findByEmail(trimmed.toLowerCase()).orElse(null);
        if (user == null) {
            try {
                user = users.findByPhone(PhoneNumber.of(trimmed)).orElse(null); // chấp nhận 0912..., +84..., có dấu cách
            } catch (Exception ignored) {
            }
        }
        // Chống dò tài khoản: KHÔNG tiết lộ gì trước khi mật khẩu được xác thực. Không tồn tại / chưa có mật khẩu / là admin /
        // sai mật khẩu đều trả cùng một lỗi INVALID_LOGIN. Luôn chạy đúng một lượt BCrypt (với hash giả nếu không có tài khoản)
        // để thời gian phản hồi cũng không phân biệt được các trường hợp.
        boolean hasPassword = user != null && user.hasPassword();
        boolean passwordOk = passwordEncoder.matches(password == null ? "" : password, hasPassword ? user.getPasswordHash() : dummyPasswordHash)
                && hasPassword;
        if (!passwordOk) {
            rateLimiter.hit(ipKey, identity.loginFailWindow());
            // Tài khoản admin không bị khóa theo tên đăng nhập: nếu không, ai biết email admin cũng có thể khóa admin từ xa.
            // Admin vẫn bị chặn theo IP, và đăng nhập admin luôn cần OTP.
            if (user == null || !user.isAdmin()) {
                rateLimiter.hit(accountKey, identity.loginFailWindow());
            }
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.INVALID_LOGIN);
        }
        if (user.isAdmin()) {
            // Admin luôn đăng nhập ở cổng quản trị (mật khẩu + OTP). Chỉ báo điều này cho người đã nhập ĐÚNG mật khẩu.
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADMIN_USE_ADMIN_LOGIN);
        }
        user.ensureActive();

        // Mặc định (otpOnLogin=false), hoặc tài khoản admin miễn OTP, hoặc thiết bị đã ghi nhớ -> đăng nhập luôn
        if (!Boolean.TRUE.equals(identity.otpOnLogin()) || user.isOtpExempt() || trustedDevices.isTrusted(trustedDeviceToken, user.getId())) {
            userAccountService.recordLogin(user.getId());
            return LoginResult.loggedIn(tokenService.issue(user, client), null);
        }

        OtpTarget target = user.otpTarget();
        long ttl = otpService.send(target, OtpPurpose.LOGIN, client.ipHash());
        String challengeId = Hashing.randomToken(24);
        redis.opsForValue().set(LOGIN_CHALLENGE_PREFIX + challengeId, user.getId() + "|" + target.channel() + "|" + target.value(),
                Duration.ofSeconds(ttl));
        return LoginResult.otpRequired(challengeId, target.masked(), ttl);
    }

    /** Đăng nhập bước 2: OTP đúng -> cấp phiên; rememberDevice -> ghi nhớ thiết bị 30 ngày (không hỏi OTP lại). */
    public LoginResult verifyLoginOtp(String challengeId, String otp, boolean rememberDevice, ClientInfo client) {
        String value = challengeId == null ? null : redis.opsForValue().get(LOGIN_CHALLENGE_PREFIX + challengeId);
        if (value == null) {
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.CHALLENGE_EXPIRED);
        }
        String[] parts = value.split("\\|", 3);
        OtpTarget target = new OtpTarget(OtpChannel.valueOf(parts[1]), parts[2]);
        otpService.verify(target, OtpPurpose.LOGIN, otp);
        redis.delete(LOGIN_CHALLENGE_PREFIX + challengeId);
        UUID userId = UUID.fromString(parts[0]);
        userAccountService.recordLogin(userId);
        String trusted = rememberDevice ? trustedDevices.remember(userId) : null;
        return LoginResult.loggedIn(tokenService.issue(userAccountService.get(userId), client), trusted);
    }

    public long trustedDeviceTtlSeconds() {
        return trustedDevices.ttlSeconds();
    }

    /**
     * Bước 1 đăng nhập admin: kiểm tra mật khẩu.
     * - Tài khoản miễn OTP (chỉ dev admin/admin): đăng nhập luôn.
     * - Còn lại: gửi OTP tới email (hoặc SĐT nếu không có email) của admin, trả challengeId cho bước 2.
     */
    public AdminLoginResult adminLogin(String email, String password, ClientInfo client) {
        // Chống dò mật khẩu: chỉ đếm lần đăng nhập SAI (5 lần / 10 phút / IP)
        String key = "rl:admin-login-fail:" + client.ipHash();
        if (rateLimiter.isExhausted(key, ADMIN_LOGIN_LIMIT)) {
            throw new ResponseException(HttpStatus.TOO_MANY_REQUESTS, ExceptionMessage.ADMIN_LOGIN_LOCKED);
        }
        UserAccount candidate = users.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(UserAccount::isAdmin)
                .orElse(null);
        // Luôn chạy một lượt BCrypt (hash giả nếu không có tài khoản) để thời gian phản hồi không lộ tài khoản admin có tồn tại hay không
        boolean hasPassword = candidate != null && candidate.getPasswordHash() != null;
        boolean passwordOk = passwordEncoder.matches(password == null ? "" : password, hasPassword ? candidate.getPasswordHash() : dummyPasswordHash)
                && hasPassword;
        if (!passwordOk) {
            rateLimiter.hit(key, ADMIN_LOGIN_WINDOW);
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.BAD_CREDENTIALS);
        }
        UserAccount user = candidate;
        user.ensureActive();
        if (user.isOtpExempt()) {
            userAccountService.recordLogin(user.getId());
            return AdminLoginResult.loggedIn(tokenService.issue(user, client));
        }
        OtpTarget target = user.otpTarget();
        long ttl = otpService.send(target, OtpPurpose.ADMIN_LOGIN, client.ipHash());
        String challengeId = Hashing.randomToken(24);
        redis.opsForValue().set(CHALLENGE_PREFIX + challengeId, user.getId().toString(), Duration.ofSeconds(ttl));
        return AdminLoginResult.otpRequired(challengeId, target.masked(), ttl);
    }

    /** Bước 2 đăng nhập admin: OTP đúng -> cấp phiên. Sai OTP chịu giới hạn 5 lần như OTP khách. */
    public IssuedTokens verifyAdminOtp(String challengeId, String otp, ClientInfo client) {
        String userId = challengeId == null ? null : redis.opsForValue().get(CHALLENGE_PREFIX + challengeId);
        if (userId == null) {
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.CHALLENGE_EXPIRED);
        }
        UserAccount user = userAccountService.get(UUID.fromString(userId));
        otpService.verify(user.otpTarget(), OtpPurpose.ADMIN_LOGIN, otp);
        redis.delete(CHALLENGE_PREFIX + challengeId);
        userAccountService.recordLogin(user.getId());
        return tokenService.issue(user, client);
    }

    public IssuedTokens refresh(String rawRefreshToken, ClientInfo client) {
        return tokenService.rotate(rawRefreshToken, client);
    }

    public void logout(String rawRefreshToken) {
        tokenService.revoke(rawRefreshToken);
    }
}
