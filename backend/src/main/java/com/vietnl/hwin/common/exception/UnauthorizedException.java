package com.vietnl.hwin.common.exception;

/** Chưa đăng nhập hoặc thông tin xác thực không hợp lệ. */
public class UnauthorizedException extends DomainException {

    public UnauthorizedException(String code, String message) {
        super(code, message);
    }
}
