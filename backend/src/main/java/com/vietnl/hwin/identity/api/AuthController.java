package com.vietnl.hwin.identity.api;

import com.vietnl.hwin.identity.api.dto.LoginRequest;
import com.vietnl.hwin.identity.api.dto.LoginResponse;
import com.vietnl.hwin.identity.api.dto.VerifyLoginOtpRequest;
import com.vietnl.hwin.identity.service.model.LoginResult;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;

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
import com.vietnl.hwin.identity.api.dto.MeResponse;
import com.vietnl.hwin.identity.api.dto.SendOtpRequest;
import com.vietnl.hwin.identity.api.dto.OtpSentResponse;
import com.vietnl.hwin.identity.api.dto.RegisterAccountRequest;
import com.vietnl.hwin.identity.api.mapper.UserMapper;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.model.IssuedTokens;
import com.vietnl.hwin.identity.service.UserAccountService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Đăng ký / đăng nhập khách, CTV: email hoặc SĐT + mật khẩu + OTP (ghi nhớ thiết bị 30 ngày); làm mới / thu hồi phiên. */
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

    /** Gửi OTP xác minh SĐT / email khi đăng ký. */
    @PostMapping("/otp")
    public ResponseEntity<OtpSentResponse> sendOtp(@Valid @RequestBody SendOtpRequest body, HttpServletRequest request) {
        var sent = authService.requestRegisterOtp(body.getPhone(), body.getEmail(), ClientInfo.from(request));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new OtpSentResponse(sent.channel().name(), sent.sentTo(), sent.expiresInSeconds()));
    }

    /** Đăng ký tài khoản khách (đủ thông tin + mật khẩu) rồi đăng nhập luôn. */
    @PostMapping("/register")
    public ResponseEntity<MeResponse> register(@Valid @RequestBody RegisterAccountRequest body, HttpServletRequest request,
                                               HttpServletResponse response) {
        var cmd = new RegisterAccountCommand(body.getFullName(), body.getDateOfBirth(), body.getAddress(), body.getCitizenId(),
                body.getPassword());
        IssuedTokens tokens = authService.registerWithOtp(body.getPhone(), body.getEmail(), body.getOtp(), cmd,
                ClientInfo.from(request));
        cookies.write(response, tokens.accessToken(), tokens.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toMe(userAccountService.get(tokens.userId())));
    }

    /** Đăng nhập bước 1: email / SĐT + mật khẩu. Thiết bị đã ghi nhớ -> đăng nhập luôn; còn lại -> OTP. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request,
                                               HttpServletResponse response) {
        LoginResult r = authService.login(body.getIdentifier(), body.getPassword(),
                AuthCookies.read(request, AuthCookies.TRUSTED_DEVICE).orElse(null), ClientInfo.from(request));
        if (r.otpRequired()) {
            return ResponseEntity.ok(new LoginResponse(true, r.challengeId(), r.sentTo(), r.expiresInSeconds(), null));
        }
        cookies.write(response, r.tokens().accessToken(), r.tokens().refreshToken());
        return ResponseEntity.ok(new LoginResponse(false, null, null, 0, mapper.toMe(userAccountService.get(r.tokens().userId()))));
    }

    /** Đăng nhập bước 2: OTP (+ "Ghi nhớ đăng nhập 30 ngày"). */
    @PostMapping("/login/verify")
    public ResponseEntity<MeResponse> verifyLogin(@Valid @RequestBody VerifyLoginOtpRequest body, HttpServletRequest request,
                                                  HttpServletResponse response) {
        LoginResult r = authService.verifyLoginOtp(body.getChallengeId(), body.getOtp(), body.isRememberDevice(),
                ClientInfo.from(request));
        cookies.write(response, r.tokens().accessToken(), r.tokens().refreshToken());
        if (r.trustedDeviceToken() != null) {
            cookies.writeTrustedDevice(response, r.trustedDeviceToken(), authService.trustedDeviceTtlSeconds());
        }
        return ResponseEntity.ok(mapper.toMe(userAccountService.get(r.tokens().userId())));
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
