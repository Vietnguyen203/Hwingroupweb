package com.vietnl.hwin.ordering.service.integration;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;

/**
 * Port vận chuyển (GHN / GHTK sau này). Demo: {@link FixedFeeShippingProvider} – phí cố định, mã vận đơn giả.
 */
public interface ShippingProvider {

    /** Phí ship cho đơn có tạm tính {@code subtotal} giao tới {@code address} (address có thể null khi xem giỏ). */
    Money quoteFee(Money subtotal, Address address);

    /** Tạo vận đơn khi giao cho đơn vị vận chuyển. @return mã vận đơn */
    String createShipment(String orderCode, Address address);
}
