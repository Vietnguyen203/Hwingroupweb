package com.vietnl.hwin.common.exception;

/** Không tìm thấy tài nguyên (hoặc tài nguyên không thuộc về người gọi – chống IDOR). */
public class NotFoundException extends DomainException {

    public NotFoundException(String message) {
        super("NOT_FOUND", message);
    }
}
