package com.vietnl.hwin.identity.api;

import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * CHỈ TỒN TẠI Ở PROFILE dev: trả OTP vừa gửi để Postman/test tự động đăng nhập.
 * Tương đương việc OTP được in ra log ở dev; môi trường thật không có bean này (404).
 */
@Profile("dev")
@Tag(name = "dev-only")
@RestController
@RequestMapping("/api/dev/otp")
public class DevOtpController {

    private final DevOtpInbox inbox;

    public DevOtpController(DevOtpInbox inbox) {
        this.inbox = inbox;
    }

    /** Truyền {@code phone} hoặc {@code email}. @param purpose LOGIN | BANK_CHANGE | ADMIN_LOGIN */
    @GetMapping("/latest")
    public Map<String, String> latest(@RequestParam(required = false) String phone,
                                      @RequestParam(required = false) String email,
                                      @RequestParam(defaultValue = "LOGIN") OtpPurpose purpose) {
        return inbox.latest(OtpTarget.of(phone, email), purpose).map(code -> Map.of("code", code))
                .orElseThrow(() -> new NotFoundException("Chưa có OTP cho nơi nhận này"));
    }
}
