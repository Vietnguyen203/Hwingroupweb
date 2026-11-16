package com.vietnl.hwin.customer.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Ngưỡng phân nhóm khách – prefix hwin.customer.
 *
 * @param loyalMinOrders số đơn tối thiểu để là khách thân thiết
 * @param dormantDays    quá số ngày này kể từ lần mua cuối -> lâu chưa quay lại
 */
@ConfigurationProperties(prefix = "hwin.customer")
public record CustomerProperties(int loyalMinOrders, int dormantDays) {

    public CustomerProperties {
        loyalMinOrders = loyalMinOrders <= 0 ? 3 : loyalMinOrders;
        dormantDays = dormantDays <= 0 ? 60 : dormantDays;
    }
}
