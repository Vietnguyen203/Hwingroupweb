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
    ORDER_NOT_FOUND("Không tìm thấy đơn hàng"),
    REVIEW_RATING_INVALID("Số sao đánh giá phải từ 1 đến 5"),
    REVIEW_COMMENT_TOO_LONG("Nội dung đánh giá tối đa #max# ký tự"),
    REVIEW_NOT_PURCHASED("Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng"),
    REVIEW_ALREADY_EXISTS("Bạn đã đánh giá sản phẩm này rồi"),
    REVIEW_PRODUCT_NOT_FOUND("Không tìm thấy sản phẩm để đánh giá"),
    REVIEW_NOT_FOUND("Không tìm thấy đánh giá");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
