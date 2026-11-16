package com.vietnl.hwin.ordering.service.integration;

import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;

/**
 * Port thanh toán (VNPay / MoMo sau này). Demo: {@link VietQrPaymentGateway} – chỉ sinh ảnh VietQR,
 * admin tự xác nhận đã nhận tiền.
 */
public interface PaymentGateway {

    /** Hướng dẫn thanh toán hiển thị cho khách; null nếu không cần (COD). */
    PaymentInstruction instructionFor(String orderCode, Money amount, PaymentMethod method);

    /**
     * @param qrImageUrl ảnh QR chuyển khoản
     * @param transferContent nội dung chuyển khoản (= mã đơn) để admin đối soát
     */
    record PaymentInstruction(String qrImageUrl, String bankBin, String accountNo, String accountName,
                              long amount, String transferContent) {
    }
}
