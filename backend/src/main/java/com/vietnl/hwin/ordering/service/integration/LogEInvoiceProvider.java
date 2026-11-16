package com.vietnl.hwin.ordering.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.VatInvoiceInfo;

/** Implementation giả: chỉ ghi log, không phát hành hóa đơn thật. */
@Component
public class LogEInvoiceProvider implements EInvoiceProvider {

    private static final Logger log = LoggerFactory.getLogger(LogEInvoiceProvider.class);

    @Override
    public String issue(String orderCode, Money total, VatInvoiceInfo info) {
        log.info("[FAKE E-INVOICE] Đơn {} – {} – MST {}", orderCode, total, info.taxCode());
        return "DEMO-INV-" + orderCode;
    }
}
