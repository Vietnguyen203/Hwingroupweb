package com.vietnl.hwin.common.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;

/**
 * Định dạng lỗi thống nhất của mọi API.
 * - {@code messageCode}: mã lỗi ổn định (ví dụ OTP_INVALID) – frontend dựa vào đây để xử lý;
 * - {@code message}: câu thông báo tiếng Việt hiển thị cho người dùng;
 * - {@code errors}: lỗi từng trường (khi validate thất bại); {@code details}: dữ liệu bổ sung.
 * Không bao giờ chứa stack trace.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ErrorResponse {
    private String traceId;
    private LocalDateTime timestamp;
    private int status;
    private HttpStatus statusCode;
    private String messageCode;
    private String message;
    private String path;
    private String method;
    private List<FieldErrorDetail> errors;
    private Map<String, Object> details;

    /** Lỗi của một trường. {@code rejectedValue} bị ẩn với trường nhạy cảm (mật khẩu, OTP, số tài khoản). */
    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FieldErrorDetail {
        private String field;
        private String message;
        private Object rejectedValue;
    }
}
