package com.vietnl.hwin.common.domain;

import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.regex.Pattern;


/**
 * Số điện thoại di động Việt Nam, chuẩn hóa về dạng E.164 (+84xxxxxxxxx).
 * Chấp nhận đầu vào: 0912345678, 84912345678, +84 912 345 678, 0912.345.678...
 */
public record PhoneNumber(String value) {

    /** 9 số sau mã quốc gia, đầu số di động 3/5/7/8/9. */
    private static final Pattern NATIONAL = Pattern.compile("[35789]\\d{8}");

    public PhoneNumber {
        if (value == null || !value.startsWith("+84") || !NATIONAL.matcher(value.substring(3)).matches()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.PHONE_INVALID);
        }
    }

    public static PhoneNumber of(String raw) {
        if (raw == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.PHONE_INVALID);
        }
        String digits = raw.replaceAll("[\\s.\\-()]", "");
        String national;
        if (digits.startsWith("+84")) {
            national = digits.substring(3);
        } else if (digits.startsWith("84") && digits.length() == 11) {
            national = digits.substring(2);
        } else if (digits.startsWith("0") && digits.length() == 10) {
            national = digits.substring(1);
        } else {
            national = digits;
        }
        return new PhoneNumber("+84" + national);
    }

    /** Dạng hiển thị trong nước: 0912345678. */
    public String local() {
        return "0" + value.substring(3);
    }

    /** Dạng che dùng cho log và hiển thị: 09******78. */
    public String masked() {
        String local = local();
        return local.substring(0, 2) + "******" + local.substring(local.length() - 2);
    }

    @Override
    public String toString() {
        return masked();
    }
}
