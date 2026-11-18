package com.vietnl.hwin.ordering.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module ordering. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CART_FULL("Cart exceeds maximum of #max# items"),
    CART_ITEM_NOT_FOUND("Item not found in cart"),
    QUANTITY_INVALID("Quantity must be greater than 0"),
    CART_EMPTY("Cart is empty"),
    ADDRESS_INVALID("Shipping address is required"),
    PAYMENT_METHOD_REQUIRED("Payment method is required"),
    PAYMENT_METHOD_INVALID("Payment confirmation is only for Bank QR orders"),
    ALREADY_PAID("Order has already been marked as paid"),
    PAYMENT_REQUIRED("Bank transfer payment must be received before confirmation"),
    CUSTOMER_CANCEL_NOT_ALLOWED("Order is already confirmed and cannot be cancelled directly"),
    INVALID_STATE_TRANSITION("Cannot #action# order while in status #status#"),
    RETURN_WINDOW_EXPIRED("Return period of #days# days has expired"),
    RETURN_WINDOW_OPEN("Return window is still active"),
    VAT_COMPANY_REQUIRED("Company name is required for VAT invoice"),
    VAT_TAX_CODE_INVALID("Invalid VAT tax code"),
    VAT_ADDRESS_REQUIRED("Company address is required for VAT invoice"),
    VAT_EMAIL_INVALID("Invalid email for VAT invoice"),
    PRODUCT_NOT_FOUND("Product not found"),
    ORDER_NOT_FOUND("Order not found"),
    CART_INVALID("Some items in cart are out of stock or inactive"),
    PLACE_ORDER_TOO_FAST("Placing orders too quickly, please try again later"),
    CANCEL_REASON_INVALID("Invalid cancel reason");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
