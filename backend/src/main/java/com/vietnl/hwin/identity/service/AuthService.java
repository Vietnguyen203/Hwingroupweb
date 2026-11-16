package com.vietnl.hwin.identity.service;

import java.time.Duration;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.UnauthorizedException;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
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
    private static final Duration ADMIN_LOGIN_WINDOW = Duration.ofMinutes(10);

    private final OtpService otpService;
    private final UserAccountService userAccountService;
    private final TokenService tokenService;
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiter rateLimiter;

    public AuthService(OtpService otpService, UserAccountService userAccountService, TokenService tokenService,
                       UserAccountRepository users, PasswordEncoder passwordEncoder, RateLimiter rateLimiter) {
        this.otpService = otpService;
        this.userAccountService = userAccountService;
        this.tokenService = tokenService;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
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

    public IssuedTokens adminLogin(String email, String password, ClientInfo client) {
        rateLimiter.acquireOrThrow("rl:admin-login:" + client.ipHash(), ADMIN_LOGIN_LIMIT, ADMIN_LOGIN_WINDOW,
                "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau");
        UserAccount user = users.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(UserAccount::isAdmin)
                .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(password, u.getPasswordHash()))
                .orElseThrow(() -> new UnauthorizedException("BAD_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng"));
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
