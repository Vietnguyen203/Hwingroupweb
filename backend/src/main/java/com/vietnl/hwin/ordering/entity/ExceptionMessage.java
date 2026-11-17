package com.vietnl.hwin.ordering.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module ordering. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CART_FULL("Giỏ hàng tối đa #max# sản phẩm"),
    CART_ITEM_NOT_FOUND("Sản phẩm không có trong giỏ"),
    QUANTITY_INVALID("Số lượng phải lớn hơn 0"),
    CART_EMPTY("Giỏ hàng đang trống"),
    ADDRESS_INVALID("Thiếu địa chỉ giao hàng"),
    PAYMENT_METHOD_REQUIRED("Chưa chọn phương thức thanh toán"),
    PAYMENT_METHOD_INVALID("Chỉ xác nhận thanh toán cho đơn chuyển khoản QR"),
    ALREADY_PAID("Đơn đã được xác nhận thanh toán"),
    PAYMENT_REQUIRED("Đơn chuyển khoản phải nhận được tiền trước khi xác nhận"),
    CUSTOMER_CANCEL_NOT_ALLOWED("Đơn đã được xác nhận, vui lòng liên hệ shop để hủy"),
    INVALID_STATE_TRANSITION("Không thể #action# khi đơn đang ở trạng thái #status#"),
    RETURN_WINDOW_EXPIRED("Đã quá hạn đổi trả #days# ngày"),
    RETURN_WINDOW_OPEN("Chưa hết hạn đổi trả"),
    VAT_COMPANY_REQUIRED("Thiếu tên công ty xuất hóa đơn"),
    VAT_TAX_CODE_INVALID("Mã số thuế không hợp lệ"),
    VAT_ADDRESS_REQUIRED("Thiếu địa chỉ công ty"),
    VAT_EMAIL_INVALID("Email nhận hóa đơn không hợp lệ"),
    PRODUCT_NOT_FOUND("Sản phẩm không tồn tại"),
    ORDER_NOT_FOUND("Không tìm thấy đơn hàng"),
    CART_INVALID("Một số sản phẩm trong giỏ đã hết hàng hoặc ngừng bán"),
    PLACE_ORDER_TOO_FAST("Bạn đặt hàng quá nhanh, vui lòng thử lại sau ít phút"),
    CANCEL_REASON_INVALID("Lý do hủy không hợp lệ");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
