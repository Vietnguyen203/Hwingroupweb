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

    /** Độ dài tối thiểu mật khẩu khách hàng / CTV. */
    public static final int CUSTOMER_MIN_LENGTH = 8;
    public static final int CUSTOMER_MAX_LENGTH = 64;

    /**
     * Password Policy cho khách hàng / CTV:
     * 8–64 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt, không có khoảng trắng,
     * không chứa phần tên email / SĐT / tên đăng nhập.
     * @throws ResponseException mã WEAK_PASSWORD kèm lý do cụ thể
     */
    public static void validateCustomer(String password, String... identifiers) {
        if (password == null || password.length() < CUSTOMER_MIN_LENGTH || password.length() > CUSTOMER_MAX_LENGTH) {
            throw weak("dài " + CUSTOMER_MIN_LENGTH + "–" + CUSTOMER_MAX_LENGTH + " ký tự");
        }
        if (password.chars().anyMatch(Character::isWhitespace)) {
            throw weak("không được có khoảng trắng");
        }
        if (!password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*")) {
            throw weak("phải có cả chữ hoa và chữ thường");
        }
        if (!password.matches(".*\\d.*")) {
            throw weak("phải có ít nhất 1 chữ số");
        }
        if (password.matches("[A-Za-z0-9]*")) {
            throw weak("phải có ít nhất 1 ký tự đặc biệt (ví dụ ! @ # $ %)");
        }
        String lower = password.toLowerCase();
        for (String id : identifiers) {
            if (id == null || id.isBlank()) {
                continue;
            }
            String name = id.trim().toLowerCase();
            int at = name.indexOf('@');
            String part = at > 0 ? name.substring(0, at) : name.replaceAll("\\D", "");
            if (part.length() >= 4 && lower.contains(part.length() > 9 ? part.substring(part.length() - 9) : part)) {
                throw weak("không được chứa email / số điện thoại");
            }
        }
    }

    private static ResponseException weak(String reason) {
        return new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.WEAK_PASSWORD, Map.of("reason", String.valueOf(reason)));
    }
}
