package com.vietnl.hwin.ordering.entity;

/** Gom các enum nhỏ của module ordering. */
public final class OrderEnums {

    private OrderEnums() {
    }

    public enum PaymentMethod {
        /** Thanh toán khi nhận hàng. */
        COD,
        /** Chuyển khoản qua mã VietQR, admin xác nhận đã nhận tiền. */
        BANK_QR
    }

    public enum PaymentStatus {
        UNPAID,
        PAID
    }

    public enum CancelReason {
        CUSTOMER_REQUEST,
        ADMIN,
        OUT_OF_STOCK,
        PAYMENT_TIMEOUT
    }
}
