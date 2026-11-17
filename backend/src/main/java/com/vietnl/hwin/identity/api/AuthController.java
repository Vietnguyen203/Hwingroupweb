package com.vietnl.hwin.identity.api;

import org.springframework.http.ResponseEntity;
import com.vietnl.hwin.identity.entity.ExceptionMessage;
import com.vietnl.hwin.common.exception.ResponseException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthCookies;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.api.responses.MeResponse;
import com.vietnl.hwin.identity.api.requests.OtpRequest;
import com.vietnl.hwin.identity.api.responses.OtpSentResponse;
import com.vietnl.hwin.identity.api.requests.OtpVerifyRequest;
import com.vietnl.hwin.identity.api.requests.RegisterRequest;
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
    public ResponseEntity<OtpSentResponse> sendOtp(@Valid @RequestBody OtpRequest body, HttpServletRequest request) {
        var sent = authService.requestOtp(body.getPhone(), body.getEmail(), body.register(), ClientInfo.from(request));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new OtpSentResponse(sent.channel().name(), sent.sentTo(), sent.expiresInSeconds()));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<MeResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest body, HttpServletRequest request,
                                HttpServletResponse response) {
        IssuedTokens tokens = authService.loginWithOtp(body.getPhone(), body.getEmail(), body.getOtp(),
                ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return ResponseEntity.ok(mapper.toMe(userAccountService.get(tokens.userId())));
    }

    @PostMapping("/register")
    public ResponseEntity<MeResponse> register(@Valid @RequestBody RegisterRequest body, HttpServletRequest request,
                               HttpServletResponse response) {
        IssuedTokens tokens = authService.registerWithOtp(body.getPhone(), body.getEmail(), body.getOtp(), body.getFullName(),
                ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toMe(userAccountService.get(tokens.userId())));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String raw = AuthCookies.read(request, AuthCookies.REFRESH)
                .orElseThrow(() -> new ResponseException(HttpStatus.UNAUTHORIZED, ExceptionMessage.REFRESH_MISSING));
        try {
            IssuedTokens tokens = authService.refresh(raw, ClientInfo.from(request));
            cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        } catch (ResponseException e) {
            cookies.clear(response);
            throw e;
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        AuthCookies.read(request, AuthCookies.REFRESH).ifPresent(authService::logout);
        cookies.clear(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(mapper.toMe(userAccountService.get(principal.userId())));
    }
}
