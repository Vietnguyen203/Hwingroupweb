package com.vietnl.hwin.identity.service;

import java.util.Map;
import com.vietnl.hwin.identity.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;

/**
 * Quy tắc mật khẩu cho tài khoản quản trị: tối thiểu 12 ký tự, có cả chữ và số,
 * không chứa tên đăng nhập và không chứa "admin" / "password".
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;

    private PasswordPolicy() {
    }

    /** @throws ResponseException mã WEAK_PASSWORD kèm lý do cụ thể */
    public static void validate(String password, String login) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw weak("tối thiểu " + MIN_LENGTH + " ký tự");
        }
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*\\d.*")) {
            throw weak("phải có cả chữ và số");
        }
        String lower = password.toLowerCase();
        if (lower.contains("admin") || lower.contains("password")) {
            throw weak("không được chứa 'admin' hoặc 'password'");
        }
        if (login != null && !login.isBlank()) {
            String name = login.trim().toLowerCase();
            int at = name.indexOf('@');
            String local = at > 0 ? name.substring(0, at) : name;
            if (local.length() >= 3 && lower.contains(local)) {
                throw weak("không được chứa tên đăng nhập");
            }
        }
    }

    private static ResponseException weak(String reason) {
        return new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.WEAK_PASSWORD, Map.of("reason", String.valueOf(reason)));
    }
}
