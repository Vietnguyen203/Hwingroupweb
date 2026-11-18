package com.vietnl.hwin.identity.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module identity. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    REFRESH_MISSING("Not logged in"),
    DEV_OTP_NOT_FOUND("OTP not found for recipient"),
    CONTACT_REQUIRED("Please provide phone number or email"),
    REFRESH_REVOKED("Refresh token has been revoked"),
    NO_OTP_CONTACT("Account has no email or phone number to receive OTP"),
    ADMIN_CONTACT_REQUIRED("Admin requires email or phone to receive OTP"),
    ADMIN_INVALID("Admin requires username/email and password"),
    USER_LOCKED("Account has been locked"),
    ROLE_REQUIRED("Cannot remove CUSTOMER role"),
    EMAIL_IN_USE("Email or username is already in use"),
    PHONE_IN_USE("Phone number is already associated with another account"),
    ACCOUNT_EXISTS("Account already exists, please log in"),
    ACCOUNT_NOT_FOUND("Account not found, please register"),
    ADMIN_USE_ADMIN_LOGIN("Admin accounts must log in via admin portal"),
    ADMIN_LOGIN_LOCKED("Too many failed attempts. Please try again in 10 minutes"),
    BAD_CREDENTIALS("Invalid username or password"),
    CHALLENGE_EXPIRED("Login session expired, please enter password again"),
    SMS_UNAVAILABLE("SMS OTP is currently unavailable, please use email"),
    EMAIL_UNAVAILABLE("Email OTP is currently unavailable"),
    OTP_SEND_LIMIT("Too many OTP requests. Please try again in a few minutes"),
    OTP_EXPIRED("OTP has expired, please request a new one"),
    OTP_LOCKED("Too many failed OTP attempts. Locked for #lockDuration# minutes"),
    OTP_INVALID("Invalid OTP code. #remaining# attempts remaining"),
    CITIZEN_ID_INVALID("Citizen ID must be exactly 12 digits"),
    CITIZEN_ID_IN_USE("Citizen ID is already associated with another account"),
    DATE_OF_BIRTH_INVALID("Date of birth must be in the past"),
    INVALID_LOGIN("Invalid email/phone or password"),
    LOGIN_LOCKED("Too many failed login attempts. Please try again in #minutes# minutes"),
    PHONE_ALREADY_SET("Account already has a phone number"),
    USER_NOT_FOUND("User account not found"),
    OTP_TEMP_LOCKED("OTP temporarily locked due to multiple failed attempts"),
    WEAK_PASSWORD("Password does not meet requirements: #reason#"),
    REFRESH_INVALID("Invalid refresh token session"),
    REFRESH_REUSED("Session has expired, please log in again"),
    REFRESH_EXPIRED("Session has expired"),
    OTP_SEND_FAILED("Failed to send OTP email, please try again later");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
