package com.vietnl.hwin.identity.api;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.identity.api.dto.AuthDtos.CreateAdminRequest;
import com.vietnl.hwin.identity.api.dto.AuthDtos.MeResponse;
import com.vietnl.hwin.identity.api.mapper.UserMapper;
import com.vietnl.hwin.identity.service.AdminAccountService;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Quản lý tài khoản quản trị. Tài khoản tạo ở đây luôn đăng nhập 2 bước (mật khẩu + OTP tới SĐT).
 */
@Tag(name = "identity-admin")
@RestController
@RequestMapping("/api/admin/admins")
public class AdminAccountController {

    private final AdminAccountService service;
    private final UserMapper mapper;

    public AdminAccountController(AdminAccountService service, UserMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<MeResponse> list() {
        return service.list(mapper::toMe);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MeResponse create(@Valid @RequestBody CreateAdminRequest r, @AuthenticationPrincipal AuthPrincipal me) {
        return service.create(r.email(), r.password(), r.fullName(), r.phone(), me.userId(), mapper::toMe);
    }
}
