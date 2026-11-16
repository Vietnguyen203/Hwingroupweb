package com.vietnl.hwin.common.exception;

/** Vượt giới hạn tần suất (rate limit) hoặc đang bị khóa tạm thời. */
public class TooManyRequestsException extends DomainException {

    public TooManyRequestsException(String code, String message) {
        super(code, message);
    }
}
