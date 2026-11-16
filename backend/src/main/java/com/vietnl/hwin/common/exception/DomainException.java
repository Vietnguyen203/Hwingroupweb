package com.vietnl.hwin.common.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.Getter;

/**
 * Vi phạm quy tắc nghiệp vụ. {@code code} là mã lỗi ổn định để frontend xử lý (ví dụ OTP_INVALID).
 * {@code details} là dữ liệu bổ sung (ví dụ danh sách sản phẩm hết hàng) – được trả kèm ProblemDetail.
 */
@Getter
public class DomainException extends RuntimeException {

    private final String code;
    private final Map<String, Object> details = new LinkedHashMap<>();

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public DomainException withDetail(String key, Object value) {
        details.put(key, value);
        return this;
    }

    public Map<String, Object> getDetails() {
        return Collections.unmodifiableMap(details);
    }
}
