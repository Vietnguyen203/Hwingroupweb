package com.vietnl.hwin.catalog.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module catalog. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CATEGORY_NAME_REQUIRED("Category name is required"),
    PRODUCT_NAME_REQUIRED("Product name is required"),
    PRODUCT_CATEGORY_REQUIRED("Product must belong to a category"),
    PRODUCT_PRICE_INVALID("Price must be greater than 0"),
    SALE_PERCENT_INVALID("Discount percent must be between 0 and #max#"),
    COMPARE_PRICE_INVALID("Compare-at price must be greater than selling price"),
    PRODUCT_IMAGE_REQUIRED("Product requires at least #min# image(s)"),
    TOO_MANY_IMAGES("Maximum #max# images per product"),
    PRODUCT_INFO_REQUIRED("#field# is required"),
    STOCK_NEGATIVE("Insufficient stock to adjust"),
    CATEGORY_NOT_FOUND("Category not found"),
    SLUG_TAKEN("Category slug already exists"),
    CATEGORY_IN_USE("Category still has active products"),
    OUT_OF_STOCK("Product is out of stock"),
    PRODUCT_SLUG_TAKEN("Product slug already exists"),
    PRODUCT_NOT_FOUND("Product not found"),
    CATEGORY_NOT_EXISTS("Category does not exist"),
    FILE_TYPE_INVALID("Only JPG, PNG, WEBP images are supported"),
    FILE_TOO_LARGE("Image size exceeds 5MB limit");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
