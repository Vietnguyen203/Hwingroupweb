package com.vietnl.hwin.ordering.service.integration;

import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.VatInvoiceInfo;

/**
 * Port hóa đơn điện tử (VNPT / Viettel / MISA sau này). Demo: {@link LogEInvoiceProvider} chỉ ghi log.
 */
public interface EInvoiceProvider {

    /** @return số hóa đơn */
    String issue(String orderCode, Money total, VatInvoiceInfo info);
}
