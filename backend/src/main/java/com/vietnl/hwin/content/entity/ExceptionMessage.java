package com.vietnl.hwin.content.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/** Mã lỗi + câu thông báo của module content (video). */
public enum ExceptionMessage implements BaseErrorMessage {
    VIDEO_NOT_FOUND("Video not found"),
    VIDEO_TITLE_REQUIRED("Video title is required"),
    VIDEO_URL_INVALID("Video URL is invalid or not a supported video link"),
    VIDEO_URL_HTTPS_REQUIRED("Only https links are supported"),
    VIDEO_URL_UNSUPPORTED_PLATFORM("Only Facebook, TikTok and YouTube links are supported"),
    VIDEO_URL_SHORT_LINK("Short or share links are not supported, please paste the full video URL"),
    VIDEO_PLATFORM_MISMATCH("Selected platform does not match the video URL"),
    VIDEO_ALREADY_EXISTS("This video has already been added"),
    VIDEO_THUMBNAIL_INVALID("Thumbnail must be an uploaded image or an https image URL"),
    VIDEO_CATEGORY_NOT_FOUND("Category does not exist"),
    VIDEO_PRODUCT_NOT_FOUND("Product does not exist or is not linked to this video"),
    VIDEO_TOO_MANY_PRODUCTS("A video can be linked to at most #max# products");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
