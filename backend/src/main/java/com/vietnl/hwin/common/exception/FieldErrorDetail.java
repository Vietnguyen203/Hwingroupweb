package com.vietnl.hwin.common.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/** Lỗi của một trường. {@code rejectedValue} bị ẩn với trường nhạy cảm (mật khẩu, OTP, số tài khoản). */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FieldErrorDetail {
    private String field;
    private String message;
    private Object rejectedValue;
}
