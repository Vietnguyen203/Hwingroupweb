package com.vietnl.hwin.common.exception;

import lombok.Getter;

/**
 * Vi phạm quy tắc nghiệp vụ. {@code code} là mã lỗi ổn định để frontend xử lý (ví dụ OTP_INVALID).
 */
@Getter
public class DomainException extends RuntimeException {

    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }
}
