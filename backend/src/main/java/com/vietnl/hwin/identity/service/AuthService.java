package com.vietnl.hwin.identity.service;

import java.time.Duration;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.TooManyRequestsException;
import com.vietnl.hwin.common.exception.UnauthorizedException;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Điều phối đăng nhập. Không @Transactional ở đây để mỗi bước là một transaction riêng
 * (tạo/cập nhật UserAccount, rồi cấp RefreshToken) – mỗi transaction chỉ sửa một aggregate.
 */
@Service
public class AuthService {

    private static final int ADMIN_LOGIN_LIMIT = 5;
    private static final String CHALLENGE_PREFIX = "admin-login-challenge:";
    private static final Duration ADMIN_LOGIN_WINDOW = Duration.ofMinutes(10);

    private final OtpService otpService;
    private final UserAccountService userAccountService;
    private final TokenService tokenService;
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiter rateLimiter;
    private final StringRedisTemplate redis;

    public AuthService(OtpService otpService, UserAccountService userAccountService, TokenService tokenService,
                       UserAccountRepository users, PasswordEncoder passwordEncoder, RateLimiter rateLimiter,
                       StringRedisTemplate redis) {
        this.otpService = otpService;
        this.userAccountService = userAccountService;
        this.tokenService = tokenService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
        this.redis = redis;
    }

    public long requestLoginOtp(String rawPhone, ClientInfo client) {
        return otpService.send(PhoneNumber.of(rawPhone), OtpPurpose.LOGIN, client.ipHash());
    }

    /** Đúng OTP -> đăng nhập; chưa có tài khoản thì tạo luôn (dùng ngay trong bước thanh toán). */
    public IssuedTokens loginWithOtp(String rawPhone, String otp, ClientInfo client) {
        PhoneNumber phone = PhoneNumber.of(rawPhone);
        otpService.verify(phone, OtpPurpose.LOGIN, otp);
        UserAccount user = userAccountService.loginByPhone(phone);
        return tokenService.issue(user, client);
    }

    /**
     * Bước 1 đăng nhập admin: kiểm tra mật khẩu.
     * - Tài khoản miễn OTP (chỉ dev admin/admin): đăng nhập luôn.
     * - Còn lại: gửi OTP tới SĐT admin, trả challengeId (sống bằng thời hạn OTP) cho bước 2.
     */
    public AdminLoginResult adminLogin(String email, String password, ClientInfo client) {
        // Chống dò mật khẩu: chỉ đếm lần đăng nhập SAI (5 lần / 10 phút / IP)
        String key = "rl:admin-login-fail:" + client.ipHash();
        if (rateLimiter.isExhausted(key, ADMIN_LOGIN_LIMIT)) {
            throw new TooManyRequestsException("RATE_LIMITED", "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 10 phút");
        }
        UserAccount user = users.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(UserAccount::isAdmin)
                .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(password, u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            rateLimiter.hit(key, ADMIN_LOGIN_WINDOW);
            throw new UnauthorizedException("BAD_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng");
        }
        user.ensureActive();
        if (user.isOtpExempt()) {
            userAccountService.recordLogin(user.getId());
            return AdminLoginResult.loggedIn(tokenService.issue(user, client));
        }
        long ttl = otpService.send(user.getPhone(), OtpPurpose.ADMIN_LOGIN, client.ipHash());
        String challengeId = Hashing.randomToken(24);
        redis.opsForValue().set(CHALLENGE_PREFIX + challengeId, user.getId().toString(), Duration.ofSeconds(ttl));
        return AdminLoginResult.otpRequired(challengeId, user.getPhone().masked(), ttl);
    }

    /** Bước 2 đăng nhập admin: OTP đúng -> cấp phiên. Sai OTP chịu giới hạn 5 lần như OTP khách. */
    public IssuedTokens verifyAdminOtp(String challengeId, String otp, ClientInfo client) {
        String userId = challengeId == null ? null : redis.opsForValue().get(CHALLENGE_PREFIX + challengeId);
        if (userId == null) {
            throw new UnauthorizedException("CHALLENGE_EXPIRED", "Phiên đăng nhập đã hết hạn, vui lòng nhập lại mật khẩu");
        }
        UserAccount user = userAccountService.get(UUID.fromString(userId));
        otpService.verify(user.getPhone(), OtpPurpose.ADMIN_LOGIN, otp);
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
