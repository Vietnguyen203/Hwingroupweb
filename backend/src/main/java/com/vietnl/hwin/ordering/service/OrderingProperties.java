package com.vietnl.hwin.ordering.service;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình module ordering – prefix hwin.ordering.
 *
 * @param shippingFee      phí ship cố định (VND)
 * @param returnWindowDays số ngày được trả hàng sau khi giao
 * @param placeOrderLimit  số đơn tối đa / 10 phút / user (chống spam)
 * @param bankQr           tài khoản nhận chuyển khoản để sinh mã VietQR
 */
@ConfigurationProperties(prefix = "hwin.ordering")
public record OrderingProperties(long shippingFee, int returnWindowDays, int placeOrderLimit, BankQr bankQr) {

    public OrderingProperties {
        placeOrderLimit = placeOrderLimit <= 0 ? 5 : placeOrderLimit;
        returnWindowDays = returnWindowDays <= 0 ? 7 : returnWindowDays;
    }

    public Duration returnWindow() {
        return Duration.ofDays(returnWindowDays);
    }

    public record BankQr(String bankBin, String accountNo, String accountName) {
    }
}
