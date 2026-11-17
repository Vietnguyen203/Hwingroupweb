package com.vietnl.hwin.identity.entity;

/** Kênh nhận OTP. SMS hiện là giả lập (chỉ dev); EMAIL gửi thật qua SMTP. */
public enum OtpChannel {
    SMS,
    EMAIL
}
