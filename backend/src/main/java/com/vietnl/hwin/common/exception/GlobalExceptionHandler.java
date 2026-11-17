package com.vietnl.hwin.common.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.vietnl.hwin.common.exception.ErrorResponse.FieldErrorDetail;

/**
 * Chuyển mọi exception thành {@link ErrorResponse}.
 * Không bao giờ trả stack trace: lỗi không lường trước -> 500 INTERNAL_SERVER (chi tiết chỉ ghi log kèm traceId).
 * Log: WARN cho lỗi validate, INFO cho lỗi nghiệp vụ, ERROR cho lỗi hệ thống.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    /** Không trả lại giá trị người dùng nhập cho các trường nhạy cảm. */
    private static final Set<String> SENSITIVE = Set.of("password", "otp", "accountNo", "code");

    @ExceptionHandler(ResponseException.class)
    ResponseEntity<ErrorResponse> response(ResponseException ex, HttpServletRequest req) {
        log.info("{} {} -> {} {}", req.getMethod(), req.getRequestURI(), ex.getStatusCode().value(), ex.getCode());
        return build(ex.getStatusCode(), ex.getMessageCode(), ex.getMessage(), req, null, ex.getDetails());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> invalid(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<FieldErrorDetail> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> FieldErrorDetail.builder()
                        .field(e.getField())
                        .message(e.getDefaultMessage() == null ? "Không hợp lệ" : e.getDefaultMessage())
                        .rejectedValue(SENSITIVE.contains(e.getField()) ? null : e.getRejectedValue())
                        .build())
                .toList();
        log.warn("{} {} -> dữ liệu không hợp lệ: {}", req.getMethod(), req.getRequestURI(),
                errors.stream().map(FieldErrorDetail::getField).toList());
        return build(HttpStatus.BAD_REQUEST, CommonErrorMessage.VALIDATION_FAILED, null, req, errors, null);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> invalidParams(HandlerMethodValidationException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, CommonErrorMessage.INVALID_PARAMS, null, req, null, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorResponse> tooLarge(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, CommonErrorMessage.FILE_TOO_LARGE, null, req, null, null);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorResponse> conflict(OptimisticLockingFailureException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, CommonErrorMessage.CONCURRENT_MODIFICATION, null, req, null, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> integrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Vi phạm ràng buộc dữ liệu: {}", ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, CommonErrorMessage.DATA_CONFLICT, null, req, null, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> unreadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, CommonErrorMessage.INVALID_BODY, null, req, null, null);
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, MultipartException.class})
    ResponseEntity<ErrorResponse> badRequest(Exception ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, CommonErrorMessage.BAD_REQUEST,
                CommonErrorMessage.BAD_REQUEST.val() + ": " + ex.getMessage(), req, null, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErrorResponse> noResource(NoResourceFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, CommonErrorMessage.PATH_NOT_FOUND, null, req, null, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> methodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, CommonErrorMessage.METHOD_NOT_ALLOWED, null, req, null, null);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorResponse> mediaType(HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, CommonErrorMessage.UNSUPPORTED_MEDIA_TYPE, null, req, null, null);
    }

    @ExceptionHandler(ErrorResponseException.class)
    ResponseEntity<ErrorResponse> errorResponse(ErrorResponseException ex, HttpServletRequest req) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return build(status, CommonErrorMessage.BAD_REQUEST, ex.getBody().getDetail(), req, null, null);
    }

    /** Lỗi không lường trước: ghi log đầy đủ kèm traceId, chỉ trả thông báo chung. */
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception ex, HttpServletRequest req) {
        ResponseEntity<ErrorResponse> res = build(HttpStatus.INTERNAL_SERVER_ERROR, CommonErrorMessage.INTERNAL_SERVER,
                null, req, null, null);
        log.error("[traceId={}] Lỗi không xử lý được tại {} {}", res.getBody().getTraceId(), req.getMethod(),
                req.getRequestURI(), ex);
        return res;
    }

    private static ResponseEntity<ErrorResponse> build(HttpStatus status, BaseErrorMessage code, String message,
                                                       HttpServletRequest req, List<FieldErrorDetail> errors,
                                                       Map<String, Object> details) {
        return ResponseEntity.status(status).body(of(status, code, message, req.getRequestURI(), req.getMethod(),
                errors, details));
    }

    /** Dùng chung cho cả SecurityConfig (401/403 do Spring Security trả). */
    public static ErrorResponse of(HttpStatus status, BaseErrorMessage code, String message, String path, String method,
                                   List<FieldErrorDetail> errors, Map<String, Object> details) {
        String traceId = MDC.get("traceId");
        return ErrorResponse.builder()
                .traceId(traceId != null ? traceId : UUID.randomUUID().toString().substring(0, 8))
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .statusCode(status)
                .messageCode(code.name())
                .message(message != null ? message : code.val())
                .path(path)
                .method(method)
                .errors(errors)
                .details(details)
                .build();
    }
}
