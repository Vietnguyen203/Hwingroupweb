package com.vietnl.hwin.ordering.service.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.service.config.OrderingProperties;
import org.junit.jupiter.api.Test;

/** Phí ship cố định, miễn phí khi tạm tính đạt ngưỡng cấu hình. */
class FixedFeeShippingProviderTest {

    private static FixedFeeShippingProvider provider(long threshold) {
        return new FixedFeeShippingProvider(new OrderingProperties(30_000, threshold, 7, 5, null, 24, false));
    }

    @Test
    void freeFromThreshold() {
        FixedFeeShippingProvider p = provider(500_000);
        assertThat(p.quoteFee(Money.of(499_999), null).amount()).isEqualTo(30_000);
        assertThat(p.quoteFee(Money.of(500_000), null).amount()).isZero();
        assertThat(p.quoteFee(Money.of(1_200_000), null).amount()).isZero();
    }

    @Test
    void emptyCartHasNoFee() {
        assertThat(provider(500_000).quoteFee(Money.ZERO, null).amount()).isZero();
    }

    @Test
    void thresholdZeroMeansNeverFree() {
        assertThat(provider(0).quoteFee(Money.of(10_000_000), null).amount()).isEqualTo(30_000);
    }
}
