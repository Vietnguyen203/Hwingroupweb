package com.vietnl.hwin.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthCookies;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.api.dto.AuthDtos.AdminLoginRequest;
import com.vietnl.hwin.identity.api.dto.AuthDtos.AdminLoginResponse;
import com.vietnl.hwin.identity.api.dto.AuthDtos.AdminOtpVerifyRequest;
import com.vietnl.hwin.identity.api.dto.AuthDtos.MeResponse;
import com.vietnl.hwin.identity.api.mapper.UserMapper;
import com.vietnl.hwin.identity.service.AdminLoginResult;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.IssuedTokens;
import com.vietnl.hwin.identity.service.UserAccountService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Đăng nhập admin 2 bước: mật khẩu -> OTP tới SĐT (chỉ tài khoản dev admin/admin được miễn OTP). */
@Tag(name = "identity")
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AuthService authService;
    private final UserAccountService userAccountService;
    private final AuthCookies cookies;
    private final UserMapper mapper;

    public AdminAuthController(AuthService authService, UserAccountService userAccountService, AuthCookies cookies,
                               UserMapper mapper) {
        this.authService = authService;
        this.userAccountService = userAccountService;
        this.cookies = cookies;
        this.mapper = mapper;
    }

    /** Bước 1: tên đăng nhập + mật khẩu. Tài khoản thường nhận otpRequired=true (OTP đã gửi tới email / SĐT của admin). */
    @PostMapping("/login")
    public AdminLoginResponse login(@Valid @RequestBody AdminLoginRequest body, HttpServletRequest request,
                                    HttpServletResponse response) {
        AdminLoginResult result = authService.adminLogin(body.email(), body.password(), ClientInfo.from(request));
        if (result.otpRequired()) {
            return new AdminLoginResponse(true, result.challengeId(), result.sentTo(), result.expiresInSeconds(), null);
        }
        cookies.write(response, result.tokens().accessToken(), result.tokens().refreshToken());
        return new AdminLoginResponse(false, null, null, 0, mapper.toMe(userAccountService.get(result.tokens().userId())));
    }

    /** Bước 2: challengeId + OTP -> cấp phiên đăng nhập. */
    @PostMapping("/login/verify")
    public MeResponse verify(@Valid @RequestBody AdminOtpVerifyRequest body, HttpServletRequest request,
                             HttpServletResponse response) {
        IssuedTokens tokens = authService.verifyAdminOtp(body.challengeId(), body.otp(), ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return mapper.toMe(userAccountService.get(tokens.userId()));
    }
}
