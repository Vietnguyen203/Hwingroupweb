package com.vietnl.hwin.common.exception;

/** Lỗi dùng chung mọi module. */
public enum CommonErrorMessage implements BaseErrorMessage {
    VALIDATION_FAILED("Xác minh dữ liệu thất bại"),
    INVALID_PARAMS("Tham số không hợp lệ"),
    INVALID_BODY("Dữ liệu gửi lên không đúng định dạng JSON"),
    BAD_REQUEST("Thiếu hoặc sai tham số"),
    UNAUTHORIZED("Vui lòng đăng nhập"),
    FORBIDDEN("Bạn không có quyền truy cập"),
    NOT_FOUND("Không tìm thấy dữ liệu"),
    PATH_NOT_FOUND("Không tìm thấy đường dẫn"),
    METHOD_NOT_ALLOWED("Phương thức không được hỗ trợ"),
    UNSUPPORTED_MEDIA_TYPE("Content-Type không được hỗ trợ"),
    FILE_TOO_LARGE("File vượt quá dung lượng cho phép"),
    CONCURRENT_MODIFICATION("Dữ liệu vừa bị thay đổi, vui lòng thử lại"),
    DATA_CONFLICT("Dữ liệu bị trùng hoặc không hợp lệ"),
    RATE_LIMITED("Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút"),
    PHONE_INVALID("Số điện thoại không hợp lệ"),
    EMAIL_INVALID("Email không hợp lệ"),
    RECIPIENT_PHONE_REQUIRED("Thiếu số điện thoại người nhận"),
    FIELD_REQUIRED("#label# không được trống"),
    FIELD_TOO_LONG("#label# quá dài"),
    MONEY_NEGATIVE("Số tiền không được âm"),
    QUANTITY_NEGATIVE("Số lượng không được âm"),
    SIMULATED_TIME_DISABLED("Không hỗ trợ giả lập thời điểm ở môi trường này"),
    INTERNAL_SERVER("Hệ thống có lỗi xảy ra, vui lòng thử lại sau");

    private final String val;

    CommonErrorMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
