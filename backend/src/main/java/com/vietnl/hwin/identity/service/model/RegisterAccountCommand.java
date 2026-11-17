package com.vietnl.hwin.identity.service.model;

import java.time.LocalDate;

/** Thông tin đăng ký tài khoản khách (ngoài SĐT / email đã xác minh OTP). */
public record RegisterAccountCommand(String fullName, LocalDate dateOfBirth, String address, String citizenId,
                                     String password) {

    @Override
    public String toString() {
        return "RegisterAccountCommand[fullName=" + fullName + ", dateOfBirth=" + dateOfBirth + "]"; // không in CCCD / mật khẩu
    }
}
