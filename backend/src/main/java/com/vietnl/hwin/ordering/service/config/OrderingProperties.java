package com.vietnl.hwin.ordering.service.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình module ordering – prefix hwin.ordering.
 *
 * @param shippingFee      phí ship cố định (VND)
 * @param freeShippingThreshold đơn có tạm tính từ mức này (VND) được miễn phí ship; 0 = không có miễn phí ship
 * @param returnWindowDays số ngày được trả hàng sau khi giao
 * @param placeOrderLimit  số đơn tối đa / 10 phút / user (chống spam)
 * @param bankQr           tài khoản nhận chuyển khoản để sinh mã VietQR
 * @param bankQrPaymentTimeoutHours đơn chuyển khoản chưa nhận tiền quá số giờ này sẽ bị hệ thống hủy
 * @param simulatedTimeEnabled cho phép admin chạy job với thời điểm giả lập (chỉ dev)
 */
@ConfigurationProperties(prefix = "hwin.ordering")
public record OrderingProperties(long shippingFee, long freeShippingThreshold, int returnWindowDays, int placeOrderLimit, BankQrProperties bankQr,
                                 int bankQrPaymentTimeoutHours, boolean simulatedTimeEnabled) {

    public OrderingProperties {
        freeShippingThreshold = Math.max(freeShippingThreshold, 0);
        placeOrderLimit = placeOrderLimit <= 0 ? 5 : placeOrderLimit;
        returnWindowDays = returnWindowDays <= 0 ? 7 : returnWindowDays;
        bankQrPaymentTimeoutHours = bankQrPaymentTimeoutHours <= 0 ? 24 : bankQrPaymentTimeoutHours;
    }

    public Duration returnWindow() {
        return Duration.ofDays(returnWindowDays);
    }

    public Duration bankQrPaymentTimeout() {
        return Duration.ofHours(bankQrPaymentTimeoutHours);
    }

}
