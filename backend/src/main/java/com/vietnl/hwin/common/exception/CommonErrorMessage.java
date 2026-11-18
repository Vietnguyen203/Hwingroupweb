package com.vietnl.hwin.common.exception;

/** Lỗi dùng chung mọi module. */
public enum CommonErrorMessage implements BaseErrorMessage {
    VALIDATION_FAILED("Validation failed"),
    INVALID_PARAMS("Invalid parameters"),
    INVALID_BODY("Invalid JSON request body"),
    BAD_REQUEST("Missing or invalid parameters"),
    UNAUTHORIZED("Unauthorized, please log in"),
    FORBIDDEN("Access denied"),
    NOT_FOUND("Resource not found"),
    PATH_NOT_FOUND("Path not found"),
    METHOD_NOT_ALLOWED("HTTP method not supported"),
    UNSUPPORTED_MEDIA_TYPE("Content-Type not supported"),
    FILE_TOO_LARGE("File size exceeds allowed limit"),
    FILE_TYPE_INVALID("Only JPG, PNG or WebP images are supported"),
    CONCURRENT_MODIFICATION("Data was modified concurrently, please retry"),
    DATA_CONFLICT("Data conflict or invalid state"),
    RATE_LIMITED("Too many requests, please try again later"),
    PHONE_INVALID("Invalid phone number"),
    EMAIL_INVALID("Invalid email address"),
    RECIPIENT_PHONE_REQUIRED("Recipient phone number is required"),
    FIELD_REQUIRED("#label# is required"),
    FIELD_TOO_LONG("#label# is too long"),
    MONEY_NEGATIVE("Amount cannot be negative"),
    QUANTITY_NEGATIVE("Quantity cannot be negative"),
    SIMULATED_TIME_DISABLED("Simulated time is disabled in this environment"),
    INTERNAL_SERVER("Internal server error, please try again later");

    private final String val;

    CommonErrorMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
