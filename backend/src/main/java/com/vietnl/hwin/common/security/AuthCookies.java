package com.vietnl.hwin.common.security;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Tạo/xóa cookie xác thực. Tất cả HttpOnly + SameSite=Lax (+ Secure theo cấu hình).
 * - hwin_at: access token, Path=/
 * - hwin_rt: refresh token, Path=/api/auth (chỉ gửi kèm các API xác thực)
 */
@Component
public class AuthCookies {

    public static final String ACCESS = "hwin_at";
    public static final String REFRESH = "hwin_rt";
    private static final String REFRESH_PATH = "/api/auth";

    private final SecurityProperties props;

    public AuthCookies(SecurityProperties props) {
        this.props = props;
    }

    public void write(HttpServletResponse response, String accessToken, String refreshToken) {
        add(response, build(ACCESS, accessToken, "/", props.accessTokenTtl()));
        add(response, build(REFRESH, refreshToken, REFRESH_PATH, props.refreshTokenTtl()));
    }

    public void clear(HttpServletResponse response) {
        add(response, build(ACCESS, "", "/", Duration.ZERO));
        add(response, build(REFRESH, "", REFRESH_PATH, Duration.ZERO));
    }

    public static Optional<String> read(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank())
                .map(Cookie::getValue)
                .findFirst();
    }

    private ResponseCookie build(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite("Lax")
                .path(path)
                .maxAge(maxAge)
                .build();
    }

    private static void add(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
