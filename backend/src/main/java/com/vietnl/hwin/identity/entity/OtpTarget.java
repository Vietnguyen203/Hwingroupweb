package com.vietnl.hwin.identity.entity;

import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;

/**
 * Nơi nhận OTP: một SĐT (kênh SMS) hoặc một email (kênh EMAIL).
 * {@code value} đã chuẩn hóa: SĐT dạng +84xxxxxxxxx, email chữ thường.
 */
public record OtpTarget(OtpChannel channel, String value) {

    public static OtpTarget phone(PhoneNumber phone) {
        return new OtpTarget(OtpChannel.SMS, phone.value());
    }

    public static OtpTarget email(EmailAddress email) {
        return new OtpTarget(OtpChannel.EMAIL, email.value());
    }

    /** Từ dữ liệu người dùng nhập: phải có đúng một trong hai (SĐT hoặc email). */
    public static OtpTarget of(String rawPhone, String rawEmail) {
        boolean hasPhone = rawPhone != null && !rawPhone.isBlank();
        boolean hasEmail = rawEmail != null && !rawEmail.isBlank();
        if (hasPhone == hasEmail) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CONTACT_REQUIRED);
        }
        return hasPhone ? phone(PhoneNumber.of(rawPhone)) : email(EmailAddress.of(rawEmail));
    }

    /** Khóa dùng trong Redis (OTP, giới hạn gửi, khóa do nhập sai). */
    public String key() {
        return channel + ":" + value;
    }

    public String masked() {
        return channel == OtpChannel.SMS ? new PhoneNumber(value).masked() : new EmailAddress(value).masked();
    }

    @Override
    public String toString() {
        return masked();
    }
}
