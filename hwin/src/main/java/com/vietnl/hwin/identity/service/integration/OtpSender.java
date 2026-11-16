package com.vietnl.hwin.identity.service.integration;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.OtpPurpose;

/**
 * Port gửi OTP. Demo: {@link LogOtpSender} in ra log.
 * Sau này thay bằng SMS brandname / Zalo ZNS mà không đổi OtpService.
 */
public interface OtpSender {

    void send(PhoneNumber phone, String code, OtpPurpose purpose);
}
