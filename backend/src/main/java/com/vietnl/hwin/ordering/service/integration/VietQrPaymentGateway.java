package com.vietnl.hwin.ordering.service.integration;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import com.vietnl.hwin.ordering.service.OrderingProperties;

/**
 * Sinh link ảnh VietQR (img.vietqr.io) theo số tiền + mã đơn. Không gọi API ngoài – trình duyệt tự tải ảnh.
 */
@Component
public class VietQrPaymentGateway implements PaymentGateway {

    private final OrderingProperties props;

    public VietQrPaymentGateway(OrderingProperties props) {
        this.props = props;
    }

    @Override
    public PaymentInstruction instructionFor(String orderCode, Money amount, PaymentMethod method) {
        if (method != PaymentMethod.BANK_QR || props.bankQr() == null) {
            return null;
        }
        var bank = props.bankQr();
        String url = "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s".formatted(
                enc(bank.bankBin()), enc(bank.accountNo()), amount.amount(), enc(orderCode), enc(bank.accountName()));
        return new PaymentInstruction(url, bank.bankBin(), bank.accountNo(), bank.accountName(), amount.amount(),
                orderCode);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }
}
