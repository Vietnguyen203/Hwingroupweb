package com.vietnl.hwin.customer.entity;

/**
 * Nhóm khách (tính khi truy vấn, không lưu):
 * - DORMANT: lâu chưa quay lại – lần mua cuối cách đây quá hwin.customer.dormant-days ngày
 * - LOYAL: thân thiết – từ hwin.customer.loyal-min-orders đơn trở lên (và chưa DORMANT)
 * - NEW: còn lại (mới hoặc chưa mua nhiều)
 */
public enum CustomerSegment {
    NEW,
    LOYAL,
    DORMANT
}
