package com.vietnl.hwin.affiliate.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.ClickRequest;
import com.vietnl.hwin.affiliate.service.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.ReferralClickService;
import com.vietnl.hwin.common.security.SecurityProperties;
import com.vietnl.hwin.common.web.ClientInfo;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Công khai: frontend gọi khi trang được mở với ?ref=CODE.
 * Mã hợp lệ -> đặt cookie hwin_ref (HttpOnly, 30 ngày); backend đọc cookie này khi đặt hàng.
 * Luôn trả 204 (không tiết lộ mã có tồn tại hay không).
 */
@Tag(name = "affiliate")
@RestController
@RequestMapping("/api/affiliate")
public class ReferralClickController {

    public static final String REF_COOKIE = "hwin_ref";

    private final ReferralClickService clicks;
    private final AffiliateProperties props;
    private final SecurityProperties security;

    public ReferralClickController(ReferralClickService clicks, AffiliateProperties props, SecurityProperties security) {
        this.clicks = clicks;
        this.props = props;
        this.security = security;
    }

    @PostMapping("/clicks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void click(@Valid @RequestBody ClickRequest body, HttpServletRequest request, HttpServletResponse response) {
        clicks.record(body.code(), body.landingPath(), ClientInfo.from(request)).ifPresent(result ->
                response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(REF_COOKIE, result.referralCode())
                        .httpOnly(true)
                        .secure(security.cookieSecure())
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(props.refCookieMaxAge())
                        .build().toString()));
    }
}
