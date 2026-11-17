package com.vietnl.hwin.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.exception.UnauthorizedException;
import com.vietnl.hwin.common.security.AuthCookies;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.api.dto.AuthDtos.MeResponse;
import com.vietnl.hwin.identity.api.dto.AuthDtos.OtpRequest;
import com.vietnl.hwin.identity.api.dto.AuthDtos.OtpSentResponse;
import com.vietnl.hwin.identity.api.dto.AuthDtos.OtpVerifyRequest;
import com.vietnl.hwin.identity.api.dto.AuthDtos.RegisterRequest;
import com.vietnl.hwin.identity.api.mapper.UserMapper;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.IssuedTokens;
import com.vietnl.hwin.identity.service.UserAccountService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Đăng ký / đăng nhập khách, CTV bằng SĐT hoặc email + OTP; làm mới và thu hồi phiên. */
@Tag(name = "identity")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserAccountService userAccountService;
    private final AuthCookies cookies;
    private final UserMapper mapper;

    public AuthController(AuthService authService, UserAccountService userAccountService, AuthCookies cookies,
                          UserMapper mapper) {
        this.authService = authService;
        this.userAccountService = userAccountService;
        this.cookies = cookies;
        this.mapper = mapper;
    }

    @PostMapping("/otp")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public OtpSentResponse sendOtp(@Valid @RequestBody OtpRequest body, HttpServletRequest request) {
        var sent = authService.requestOtp(body.phone(), body.email(), body.register(), ClientInfo.from(request));
        return new OtpSentResponse(sent.channel().name(), sent.sentTo(), sent.expiresInSeconds());
    }

    @PostMapping("/otp/verify")
    public MeResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest body, HttpServletRequest request,
                                HttpServletResponse response) {
        IssuedTokens tokens = authService.loginWithOtp(body.phone(), body.email(), body.otp(),
                ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return mapper.toMe(userAccountService.get(tokens.userId()));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MeResponse register(@Valid @RequestBody RegisterRequest body, HttpServletRequest request,
                               HttpServletResponse response) {
        IssuedTokens tokens = authService.registerWithOtp(body.phone(), body.email(), body.otp(), body.fullName(),
                ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return mapper.toMe(userAccountService.get(tokens.userId()));
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void refresh(HttpServletRequest request, HttpServletResponse response) {
        String raw = AuthCookies.read(request, AuthCookies.REFRESH)
                .orElseThrow(() -> new UnauthorizedException("REFRESH_MISSING", "Chưa đăng nhập"));
        try {
            IssuedTokens tokens = authService.refresh(raw, ClientInfo.from(request));
            cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        } catch (UnauthorizedException e) {
            cookies.clear(response);
            throw e;
        }
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        AuthCookies.read(request, AuthCookies.REFRESH).ifPresent(authService::logout);
        cookies.clear(response);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        return mapper.toMe(userAccountService.get(principal.userId()));
    }
}
