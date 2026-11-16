package com.vietnl.hwin.identity.entity;

/** Mục đích của OTP – mỗi mục đích một key Redis riêng. */
public enum OtpPurpose {
    /** Đăng nhập / tạo tài khoản bằng SĐT. */
    LOGIN,
    /** CTV đổi tài khoản ngân hàng. */
    BANK_CHANGE
}
