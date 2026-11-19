package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Bộ lọc của trang tìm kiếm / danh mục: khoảng giá thực trả, còn hàng, đang giảm giá. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ProductSearchFilterTests {

    @Autowired ProductSearchService search;

    private List<Product> find(Long min, Long max, boolean inStock, boolean onSale) {
        var criteria = new ProductSearchCriteria(null, null, ProductSort.PRICE_ASC, 0, 60, true, min, max, inStock, onSale);
        return search.search(criteria, p -> p).getContent();
    }

    @Test
    void priceRangeKeepsOnlyProductsWithinEffectivePrice() {
        List<Product> all = find(null, null, false, false);
        assertThat(all).isNotEmpty();

        List<Product> within = find(100_000L, 300_000L, false, false);
        assertThat(within).isNotEmpty().hasSizeLessThan(all.size());
        assertThat(within).allSatisfy(p -> assertThat(p.getEffectivePrice().amount()).isBetween(100_000L, 300_000L));
        // sắp theo giá tăng dần vẫn giữ nguyên khi lọc
        assertThat(within).extracting(p -> p.getEffectivePrice().amount()).isSorted();

        assertThat(find(null, 1L, false, false)).isEmpty();
    }

    @Test
    void minOnlyAndMaxOnlyAreBothSupported() {
        assertThat(find(200_000L, null, false, false))
                .isNotEmpty().allSatisfy(p -> assertThat(p.getEffectivePrice().amount()).isGreaterThanOrEqualTo(200_000L));
        assertThat(find(null, 200_000L, false, false))
                .isNotEmpty().allSatisfy(p -> assertThat(p.getEffectivePrice().amount()).isLessThanOrEqualTo(200_000L));
    }

    @Test
    void reversedRangeIsTreatedAsSwapped() {
        assertThat(find(300_000L, 100_000L, false, false)).extracting(Product::getId)
                .containsExactlyElementsOf(find(100_000L, 300_000L, false, false).stream().map(Product::getId).toList());
    }

    @Test
    void inStockOnlyExcludesSoldOutProducts() {
        assertThat(find(null, null, true, false)).isNotEmpty().allSatisfy(p -> assertThat(p.isInStock()).isTrue());
    }

    @Test
    void onSaleOnlyReturnsDiscountedProducts() {
        List<Product> onSale = find(null, null, false, true);
        assertThat(onSale).isNotEmpty().allSatisfy(p -> assertThat(p.discountPercent()).isPositive());
        // combo Tết sum vầy có giá gạch ngang 340.000đ > giá bán 299.000đ
        assertThat(onSale).extracting(Product::getSlug).contains("combo-tet-sum-vay");
    }

    @Test
    void filtersCanBeCombined() {
        assertThat(find(100_000L, 400_000L, true, true)).allSatisfy(p -> {
            assertThat(p.getEffectivePrice().amount()).isBetween(100_000L, 400_000L);
            assertThat(p.isInStock()).isTrue();
            assertThat(p.discountPercent()).isPositive();
        });
    }
}
