package com.vietnl.hwin.identity.service.integration;

import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;

/**
 * Port gửi OTP theo từng kênh.
 * - EMAIL: {@link EmailOtpSender} gửi thật qua SMTP.
 * - SMS: {@link SimulatedSmsOtpSender} giả lập; sau này thay bằng SMS brandname (xem docs/07-otp-sms.md)
 *   mà không đổi OtpService.
 */
public interface OtpSender {

    OtpChannel channel();

    /** false = kênh chưa dùng được ở môi trường này (OtpService báo lỗi rõ ràng cho người dùng). */
    default boolean available() {
        return true;
    }

    /** @param destination SĐT dạng +84xxxxxxxxx hoặc email chữ thường */
    void send(String destination, String code, OtpPurpose purpose);
}
