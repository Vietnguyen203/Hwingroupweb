package com.vietnl.hwin.identity.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module identity. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    REFRESH_MISSING("Chưa đăng nhập"),
    DEV_OTP_NOT_FOUND("Chưa có OTP cho nơi nhận này"),
    CONTACT_REQUIRED("Nhập số điện thoại hoặc email (chỉ một trong hai)"),
    REFRESH_REVOKED("Refresh token đã bị thu hồi"),
    NO_OTP_CONTACT("Tài khoản chưa có email hoặc số điện thoại để nhận OTP"),
    ADMIN_CONTACT_REQUIRED("Admin cần email thật hoặc số điện thoại để nhận OTP đăng nhập"),
    ADMIN_INVALID("Admin cần email/tên đăng nhập và mật khẩu"),
    USER_LOCKED("Tài khoản đã bị khóa"),
    ROLE_REQUIRED("Không thể gỡ vai trò CUSTOMER"),
    EMAIL_IN_USE("Email / tên đăng nhập đã được dùng"),
    PHONE_IN_USE("Số điện thoại đã gắn với tài khoản khác"),
    ACCOUNT_EXISTS("Tài khoản đã tồn tại, vui lòng đăng nhập"),
    ACCOUNT_NOT_FOUND("Chưa có tài khoản, vui lòng đăng ký"),
    ADMIN_USE_ADMIN_LOGIN("Tài khoản quản trị phải đăng nhập tại trang quản trị"),
    ADMIN_LOGIN_LOCKED("Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 10 phút"),
    BAD_CREDENTIALS("Tên đăng nhập hoặc mật khẩu không đúng"),
    CHALLENGE_EXPIRED("Phiên đăng nhập đã hết hạn, vui lòng nhập lại mật khẩu"),
    SMS_UNAVAILABLE("Hiện chưa gửi được OTP qua SMS, vui lòng dùng email"),
    EMAIL_UNAVAILABLE("Hiện chưa gửi được OTP qua email"),
    OTP_SEND_LIMIT("Bạn đã yêu cầu OTP quá nhiều lần, vui lòng thử lại sau ít phút"),
    OTP_EXPIRED("Mã OTP đã hết hạn, vui lòng gửi lại"),
    OTP_LOCKED("Nhập sai OTP quá #maxAttempts# lần. Vui lòng thử lại sau #lockDuration# phút"),
    OTP_INVALID("Mã OTP không đúng. Còn #remaining# lần thử"),
    CITIZEN_ID_INVALID("Số CCCD gồm đúng 12 chữ số"),
    CITIZEN_ID_IN_USE("Số CCCD đã được dùng cho tài khoản khác"),
    DATE_OF_BIRTH_INVALID("Ngày sinh phải là ngày trong quá khứ"),
    INVALID_LOGIN("Email / số điện thoại hoặc mật khẩu không đúng. Nếu bạn chưa đặt mật khẩu, vui lòng liên hệ hỗ trợ"),
    LOGIN_LOCKED("Đăng nhập sai quá nhiều lần, vui lòng thử lại sau #minutes# phút"),
    PHONE_ALREADY_SET("Tài khoản đã có số điện thoại"),
    USER_NOT_FOUND("Không tìm thấy tài khoản"),
    OTP_TEMP_LOCKED("Tạm khóa nhận OTP do nhập sai nhiều lần, vui lòng thử lại sau"),
    WEAK_PASSWORD("Mật khẩu chưa đạt yêu cầu: #reason#"),
    REFRESH_INVALID("Phiên đăng nhập không hợp lệ"),
    REFRESH_REUSED("Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại"),
    REFRESH_EXPIRED("Phiên đăng nhập đã hết hạn"),
    OTP_SEND_FAILED("Không gửi được email, vui lòng thử lại sau");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
