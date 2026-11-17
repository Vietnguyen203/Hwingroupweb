package com.vietnl.hwin.catalog.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module catalog. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    CATEGORY_NAME_REQUIRED("Tên danh mục không được trống"),
    PRODUCT_NAME_REQUIRED("Tên sản phẩm không được trống"),
    PRODUCT_CATEGORY_REQUIRED("Sản phẩm phải thuộc một danh mục"),
    PRODUCT_PRICE_INVALID("Giá bán phải lớn hơn 0"),
    SALE_PERCENT_INVALID("Phần trăm giảm giá phải là số nguyên từ 0 đến #max#"),
    COMPARE_PRICE_INVALID("Giá gốc phải lớn hơn giá bán"),
    PRODUCT_IMAGE_REQUIRED("Sản phẩm cần ít nhất #min# ảnh"),
    TOO_MANY_IMAGES("Tối đa #max# ảnh mỗi sản phẩm"),
    PRODUCT_INFO_REQUIRED("#field# không được trống"),
    STOCK_NEGATIVE("Tồn kho không đủ để điều chỉnh"),
    CATEGORY_NOT_FOUND("Không tìm thấy danh mục"),
    SLUG_TAKEN("Slug danh mục đã tồn tại"),
    CATEGORY_IN_USE("Danh mục còn sản phẩm đang bán, hãy ẩn sản phẩm trước"),
    OUT_OF_STOCK("Sản phẩm đã hết hàng"),
    PRODUCT_SLUG_TAKEN("Slug sản phẩm đã tồn tại"),
    PRODUCT_NOT_FOUND("Không tìm thấy sản phẩm"),
    CATEGORY_NOT_EXISTS("Danh mục không tồn tại"),
    FILE_TYPE_INVALID("Chỉ hỗ trợ ảnh JPG, PNG, WEBP"),
    FILE_TOO_LARGE("Ảnh tối đa 5MB");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
