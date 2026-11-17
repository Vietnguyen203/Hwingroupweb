package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.entity.ExceptionMessage;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Duration;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    /**
     * Gửi OTP tới SĐT (SMS) hoặc email – đúng nơi khách đã nhập.
     * {@code register=false} (đăng nhập): tài khoản phải tồn tại; {@code register=true}: phải CHƯA tồn tại.
     * Kiểm tra trước khi gửi để báo ngay "chưa có tài khoản / đã có tài khoản" (giới hạn 20 lần / 10 phút / IP
     * để hạn chế dò tài khoản).
     */
    public OtpDispatch requestOtp(String rawPhone, String rawEmail, boolean register, ClientInfo client) {
        OtpTarget target = OtpTarget.of(rawPhone, rawEmail);
        if (!rateLimiter.tryAcquire("rl:auth-lookup:" + client.ipHash(), LOOKUP_LIMIT, ADMIN_LOGIN_WINDOW)) {
            throw new ResponseException(HttpStatus.TOO_MANY_REQUESTS, CommonErrorMessage.RATE_LIMITED);
        }
        var existing = userAccountService.find(target);
        if (register && existing.isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_EXISTS);
        }
        if (!register) {
            UserAccount user = existing.orElseThrow(() ->
                    new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ACCOUNT_NOT_FOUND));
            if (user.isAdmin()) {
                throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADMIN_USE_ADMIN_LOGIN);
            }
        }
        long ttl = otpService.send(target, register ? OtpPurpose.REGISTER : OtpPurpose.LOGIN, client.ipHash());
        return new OtpDispatch(target.channel(), target.masked(), ttl);
    }

    /** Đăng nhập tài khoản đã có bằng OTP. */
    public IssuedTokens loginWithOtp(String rawPhone, String rawEmail, String otp, ClientInfo client) {
        OtpTarget target = OtpTarget.of(rawPhone, rawEmail);
        otpService.verify(target, OtpPurpose.LOGIN, otp);
        return tokenService.issue(userAccountService.login(target), client);
    }

    /** Đăng ký tài khoản mới bằng OTP rồi đăng nhập luôn. */
    public IssuedTokens registerWithOtp(String rawPhone, String rawEmail, String otp, String fullName, ClientInfo client) {
        OtpTarget target = OtpTarget.of(rawPhone, rawEmail);
        otpService.verify(target, OtpPurpose.REGISTER, otp);
        return tokenService.issue(userAccountService.register(target, fullName), client);
    }

    /** OTP đã gửi: kênh, nơi nhận (đã che), thời gian hiệu lực (giây). */
    public record OtpDispatch(OtpChannel channel, String sentTo, long expiresInSeconds) {
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
        UserAccount user = users.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(UserAccount::isAdmin)
                .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(password, u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            rateLimiter.hit(key, ADMIN_LOGIN_WINDOW);
            throw new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.BAD_CREDENTIALS);
        }
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
