package com.vietnl.hwin.common.validation;

/** Regex dùng chung cho request DTO. */
public final class ValidationPatterns {

    /** SĐT người dùng nhập (chuẩn hóa sau bằng PhoneNumber.of). */
    public static final String PHONE = "^[0-9+ .\\-]{9,16}$";

    private ValidationPatterns() {
    }
}
