package com.vietnl.hwin.common.domain;

import java.util.regex.Pattern;

import com.vietnl.hwin.common.exception.DomainException;

/**
 * Địa chỉ email, chuẩn hóa về chữ thường, bỏ khoảng trắng hai đầu.
 */
public record EmailAddress(String value) {

    private static final Pattern FORMAT = Pattern.compile("^[^@\\s]{1,64}@[^@\\s]+\\.[^@\\s]{2,}$");

    public EmailAddress {
        if (!isValid(value)) {
            throw new DomainException("EMAIL_INVALID", "Email không hợp lệ");
        }
    }

    public static EmailAddress of(String raw) {
        return new EmailAddress(raw == null ? null : raw.trim().toLowerCase());
    }

    /** true nếu chuỗi đúng dạng email (dùng để phân biệt email với tên đăng nhập admin như "admin"). */
    public static boolean isValid(String raw) {
        return raw != null && raw.length() <= 255 && FORMAT.matcher(raw.trim()).matches();
    }

    /** Dạng che dùng cho log và hiển thị: ng******@gmail.com. */
    public String masked() {
        int at = value.indexOf('@');
        String local = value.substring(0, at);
        return local.substring(0, Math.min(2, local.length())) + "******" + value.substring(at);
    }

    @Override
    public String toString() {
        return masked();
    }
}
