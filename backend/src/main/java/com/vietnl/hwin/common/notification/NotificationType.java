package com.vietnl.hwin.common.notification;

/**
 * Loại thông báo. Backend chỉ gửi mã loại + dữ liệu; giao diện dịch sang tiếng Việt (tiêu đề, nội dung, biểu tượng).
 */
public enum NotificationType {
    // Admin
    /** Có đơn hàng mới. data: orderCode, total. */
    ORDER_PLACED,
    /** CTV vừa gửi hồ sơ đăng ký chờ duyệt. data: fullName. */
    AFFILIATE_APPLIED,
    /** CTV gửi yêu cầu rút tiền. data: amount. */
    PAYOUT_REQUESTED,

    // Khách
    /** Đơn được xác nhận. data: orderCode. */
    ORDER_CONFIRMED,
    /** Đơn đã giao cho vận chuyển. data: orderCode. */
    ORDER_SHIPPED,
    /** Đơn giao thành công. data: orderCode. */
    ORDER_DELIVERED,
    /** Đơn bị hủy (không do khách tự hủy). data: orderCode, reason. */
    ORDER_CANCELLED,
    /** Đơn được ghi nhận trả hàng. data: orderCode. */
    ORDER_RETURNED,

    // CTV
    /** Có đơn mới qua link giới thiệu, hoa hồng đang chờ duyệt. data: orderCode, amount. */
    COMMISSION_EARNED,
    /** Hoa hồng được duyệt, cộng vào số dư. data: amount. */
    COMMISSION_APPROVED,
    /** Yêu cầu rút tiền được duyệt. data: amount. */
    PAYOUT_APPROVED,
    /** Đã chi trả yêu cầu rút tiền. data: amount. */
    PAYOUT_PAID,
    /** Yêu cầu rút tiền bị từ chối. data: amount. */
    PAYOUT_REJECTED,
    /** Hồ sơ CTV được duyệt. */
    AFFILIATE_APPROVED,
    /** Hồ sơ CTV bị từ chối. */
    AFFILIATE_REJECTED
}
