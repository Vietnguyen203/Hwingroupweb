package com.vietnl.hwin.common.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/**
 * Exception duy nhất cho lỗi nghiệp vụ / lỗi có chủ đích: HTTP status + mã lỗi ({@link BaseErrorMessage}).
 * {@code data} thay placeholder {@code #key#} trong câu thông báo; {@code details} là dữ liệu bổ sung trả kèm
 * (ví dụ danh sách sản phẩm hết hàng).
 * Không throw RuntimeException thô cho lỗi nghiệp vụ.
 */
@Getter
public class ResponseException extends RuntimeException {

    private final HttpStatus statusCode;
    private final BaseErrorMessage messageCode;
    private final Map<String, Object> details = new LinkedHashMap<>();

    public ResponseException(HttpStatus statusCode, BaseErrorMessage messageCode) {
        this(statusCode, messageCode, Map.of());
    }

    public ResponseException(HttpStatus statusCode, BaseErrorMessage messageCode, Map<String, String> data) {
        super(replaceKeywords(messageCode.val(), data));
        this.statusCode = statusCode;
        this.messageCode = messageCode;
        this.details.putAll(data); // số liệu của câu thông báo cũng trả về frontend để dịch theo mã lỗi
    }

    /** Mã lỗi dạng chuỗi (tên hằng enum) – frontend và test dùng. */
    public String getCode() {
        return messageCode.name();
    }

    public ResponseException withDetail(String key, Object value) {
        details.put(key, value);
        return this;
    }

    public Map<String, Object> getDetails() {
        return Collections.unmodifiableMap(details);
    }

    /** "Còn #remaining# lần thử" + {remaining=3} -> "Còn 3 lần thử". */
    static String replaceKeywords(String message, Map<String, String> data) {
        String result = message;
        for (Map.Entry<String, String> e : data.entrySet()) {
            result = result.replace("#" + e.getKey() + "#", String.valueOf(e.getValue()));
        }
        return result;
    }
}
