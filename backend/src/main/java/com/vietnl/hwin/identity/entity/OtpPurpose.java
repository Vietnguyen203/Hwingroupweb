package com.vietnl.hwin.identity.entity;

/** Mục đích của OTP – mỗi mục đích một key Redis riêng. */
public enum OtpPurpose {
    /** Đăng nhập tài khoản khách / CTV đã có (SĐT hoặc email). */
    LOGIN,
    /** Đăng ký tài khoản khách mới (SĐT hoặc email). */
    REGISTER,
    /** Thêm SĐT vào tài khoản đăng ký bằng email. */
    ADD_PHONE,
    /** CTV đổi tài khoản ngân hàng. */
    BANK_CHANGE,
    /** Bước 2 đăng nhập quản trị (sau khi nhập đúng mật khẩu). */
    ADMIN_LOGIN
}
