package com.vietnl.hwin.identity.service.model;

import org.springframework.modulith.NamedInterface;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;

/**
 * Thông tin liên hệ của một tài khoản – công bố cho module khác.
 * Tài khoản khách có SĐT, email hoặc cả hai (ít nhất một).
 */
@NamedInterface("services")
public record UserContact(PhoneNumber phone, EmailAddress email, String fullName) {

    /** Dạng che để hiển thị: ưu tiên SĐT, không có thì email. */
    public String masked() {
        if (phone != null) {
            return phone.masked();
        }
        return email == null ? "–" : email.masked();
    }
}
