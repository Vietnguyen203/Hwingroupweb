package com.vietnl.hwin.ordering.service.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.service.config.OrderingProperties;

/** Implementation giả: phí ship cố định theo cấu hình hwin.ordering.shipping-fee. */
@Component
public class FixedFeeShippingProvider implements ShippingProvider {

    private static final Logger log = LoggerFactory.getLogger(FixedFeeShippingProvider.class);

    private final OrderingProperties props;

    public FixedFeeShippingProvider(OrderingProperties props) {
        this.props = props;
    }

    @Override
    public Money quoteFee(Money subtotal, Address address) {
        return subtotal.isZero() ? Money.ZERO : Money.of(props.shippingFee());
    }

    @Override
    public String createShipment(String orderCode, Address address) {
        String tracking = "DEMO-" + orderCode;
        log.info("[FAKE SHIPPING] Tạo vận đơn {} cho đơn {}", tracking, orderCode);
        return tracking;
    }
}
