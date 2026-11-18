package com.vietnl.hwin.customer.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module customer. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CONTACT_REQUIRED("Customer requires phone number or email"),
    NAME_TOO_LONG("Full name cannot exceed 100 characters"),
    ADDRESS_LIMIT("Maximum #max# addresses allowed"),
    ADDRESS_NOT_FOUND("Address not found"),
    CUSTOMER_NOT_FOUND("Customer not found"),
    USER_NOT_FOUND("User account not found"),
    ORDER_NOT_FOUND("Order not found"),
    REVIEW_RATING_INVALID("Rating must be between 1 and 5 stars"),
    REVIEW_COMMENT_TOO_LONG("Review comment cannot exceed #max# characters"),
    REVIEW_NOT_PURCHASED("You can only review delivered products"),
    REVIEW_ALREADY_EXISTS("You have already reviewed this product"),
    REVIEW_PRODUCT_NOT_FOUND("Product not found for review"),
    REVIEW_NOT_FOUND("Review not found");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
