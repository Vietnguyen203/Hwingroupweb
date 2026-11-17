package com.vietnl.hwin.identity.entity;

/** Mục đích của OTP – mỗi mục đích một key Redis riêng. */
public enum OtpPurpose {
    /** Đăng nhập / tạo tài khoản bằng SĐT. */
    LOGIN,
    /** CTV đổi tài khoản ngân hàng. */
    BANK_CHANGE,
    /** Bước 2 đăng nhập quản trị (sau khi nhập đúng mật khẩu). */
    ADMIN_LOGIN
}
