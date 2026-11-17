package com.vietnl.hwin.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.api.dto.AddPhoneRequest;
import com.vietnl.hwin.identity.api.dto.MeResponse;
import com.vietnl.hwin.identity.api.dto.OtpSentResponse;
import com.vietnl.hwin.identity.api.dto.SendPhoneOtpRequest;
import com.vietnl.hwin.identity.api.mapper.UserMapper;
import com.vietnl.hwin.identity.service.UserAccountService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Thêm SĐT cho tài khoản đăng ký bằng email (xác minh OTP) – SĐT sau đó dùng được làm tên đăng nhập. */
@Tag(name = "identity")
@RestController
@RequestMapping("/api/me/phone")
public class MyPhoneController {

    private final UserAccountService users;
    private final UserMapper mapper;

    public MyPhoneController(UserAccountService users, UserMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    @PostMapping("/otp")
    public ResponseEntity<OtpSentResponse> sendOtp(@AuthenticationPrincipal AuthPrincipal me,
                                                   @Valid @RequestBody SendPhoneOtpRequest body, HttpServletRequest request) {
        var sent = users.requestAddPhoneOtp(me.userId(), body.getPhone(), ClientInfo.from(request).ipHash());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new OtpSentResponse(sent.channel().name(), sent.sentTo(), sent.expiresInSeconds()));
    }

    @PutMapping
    public ResponseEntity<MeResponse> addPhone(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody AddPhoneRequest body) {
        return ResponseEntity.ok(mapper.toMe(users.addPhone(me.userId(), body.getPhone(), body.getOtp())));
    }
}
