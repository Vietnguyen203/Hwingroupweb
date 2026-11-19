package com.vietnl.hwin.catalog.service.model;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.catalog.entity.ProductSort;
import org.junit.jupiter.api.Test;

class ProductSearchCriteriaTest {

    private static ProductSearchCriteria withPrice(Long min, Long max) {
        return new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 20, true, min, max, false, false);
    }

    @Test
    void keepsAValidRange() {
        var c = withPrice(100_000L, 300_000L);
        assertThat(c.minPrice()).isEqualTo(100_000L);
        assertThat(c.maxPrice()).isEqualTo(300_000L);
    }

    @Test
    void swapsAReversedRange() {
        var c = withPrice(300_000L, 100_000L);
        assertThat(c.minPrice()).isEqualTo(100_000L);
        assertThat(c.maxPrice()).isEqualTo(300_000L);
    }

    @Test
    void ignoresNegativePrices() {
        var c = withPrice(-5L, -1L);
        assertThat(c.minPrice()).isNull();
        assertThat(c.maxPrice()).isNull();
    }

    @Test
    void shortConstructorDoesNotFilterByPriceStockOrSale() {
        var c = new ProductSearchCriteria("nem", null, ProductSort.NEWEST, 0, 20, true);
        assertThat(c.minPrice()).isNull();
        assertThat(c.maxPrice()).isNull();
        assertThat(c.inStockOnly()).isFalse();
        assertThat(c.onSaleOnly()).isFalse();
    }
}
