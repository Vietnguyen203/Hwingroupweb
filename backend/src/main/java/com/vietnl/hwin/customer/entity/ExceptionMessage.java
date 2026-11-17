package com.vietnl.hwin.customer.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module customer. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CONTACT_REQUIRED("Khách hàng cần số điện thoại hoặc email"),
    NAME_TOO_LONG("Họ tên tối đa 100 ký tự"),
    ADDRESS_LIMIT("Tối đa #max# địa chỉ"),
    ADDRESS_NOT_FOUND("Không tìm thấy địa chỉ"),
    CUSTOMER_NOT_FOUND("Không tìm thấy khách hàng"),
    USER_NOT_FOUND("Không tìm thấy tài khoản"),
    ORDER_NOT_FOUND("Không tìm thấy đơn hàng");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
