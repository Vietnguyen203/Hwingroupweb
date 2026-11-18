package com.vietnl.hwin.affiliate.service.config;

import java.math.BigDecimal;
import java.time.Duration;

import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import com.vietnl.hwin.common.domain.Money;

/**
 * Quy tắc chương trình CTV – prefix hwin.affiliate (application.yml).
 *
 * @param commissionRate        tỉ lệ hoa hồng trên (subtotal - discount), ví dụ 0.10
 * @param holdDays              số ngày giữ hoa hồng sau khi giao trước khi duyệt
 * @param minPayout             mức rút tối thiểu (VND)
 * @param refCookieDays         thời gian sống cookie ref
 * @param clickDedupeHours      không đếm trùng click cùng IP + mã trong khoảng này
 * @param bankChangeLockHours   khóa rút tiền sau khi đổi tài khoản ngân hàng
 * @param bankEncryptionKey     khóa AES-256 (base64, 32 byte) mã hóa thông tin ngân hàng
 * @param shareBaseUrl          domain frontend dùng để tạo link chia sẻ
 * @param simulatedTimeEnabled  cho phép admin chạy job duyệt hoa hồng với thời điểm giả lập (chỉ dev)
 * @param idCardUploadsPerHour  số lần tải ảnh CCCD tối đa mỗi người mỗi giờ (mặc định 10; chống tải tràn đĩa)
 * @param idCardRetentionDays   số ngày giữ ảnh CCCD của hồ sơ CTV bị từ chối trước khi xóa (mặc định 30)
 */
@Validated
@ConfigurationProperties(prefix = "hwin.affiliate")
public record AffiliateProperties(
        BigDecimal commissionRate,
        int holdDays,
        long minPayout,
        int refCookieDays,
        int clickDedupeHours,
        int bankChangeLockHours,
        @NotBlank String bankEncryptionKey,
        String shareBaseUrl,
        boolean simulatedTimeEnabled,
        int idCardUploadsPerHour,
        int idCardRetentionDays) {

    public AffiliateProperties {
        idCardUploadsPerHour = idCardUploadsPerHour <= 0 ? 10 : idCardUploadsPerHour;
        idCardRetentionDays = idCardRetentionDays <= 0 ? 30 : idCardRetentionDays;
    }

    public Duration hold() {
        return Duration.ofDays(holdDays);
    }

    public Duration idCardRetention() {
        return Duration.ofDays(idCardRetentionDays);
    }

    public Duration bankChangeLock() {
        return Duration.ofHours(bankChangeLockHours);
    }

    public Duration clickDedupe() {
        return Duration.ofHours(clickDedupeHours);
    }

    public Duration refCookieMaxAge() {
        return Duration.ofDays(refCookieDays);
    }

    public Money minPayoutMoney() {
        return Money.of(minPayout);
    }
}
