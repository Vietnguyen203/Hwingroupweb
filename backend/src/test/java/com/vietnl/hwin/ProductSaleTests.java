package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductAdminService;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.ordering.service.CartService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Giảm giá thêm (%) do admin đặt: áp cho giỏ hàng / đặt hàng và sắp xếp theo giá thực trả. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ProductSaleTests {

    private static final UUID ADMIN = UUID.randomUUID();

    @Autowired ProductAdminService admin;
    @Autowired ProductQueryService productQuery;
    @Autowired ProductSearchService search;
    @Autowired CartService cart;
    @Autowired UserAccountService users;

    private UUID productId(String slug) {
        return search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 60, false), p -> p)
                .getContent().stream().filter(p -> p.getSlug().equals(slug)).findFirst().orElseThrow().getId();
    }

    @Test
    void saleLowersCartPriceAndCanBeRemoved() {
        UUID combo = productId("combo-tet-sum-vay"); // niêm yết 299.000đ
        UUID user = users.loginByPhone(PhoneNumber.of("0966100001")).getId();
        try {
            admin.setSale(combo, 15, ADMIN);
            assertThat(productQuery.findSnapshot(combo).orElseThrow().price()).isEqualTo(254_150); // 299.000 x 85%
            var view = cart.addItem(user, combo, 2);
            assertThat(view.subtotal()).isEqualTo(508_300);

            admin.setSale(combo, 0, ADMIN);
            assertThat(productQuery.findSnapshot(combo).orElseThrow().price()).isEqualTo(299_000);
        } finally {
            admin.setSale(combo, 0, ADMIN);
        }
    }

    @Test
    void sortByPriceUsesPriceAfterSale() {
        UUID combo = productId("combo-tet-sum-vay");
        try {
            admin.setSale(combo, 90, ADMIN); // 29.900đ: rẻ nhất cửa hàng
            List<UUID> cheapestFirst = search.search(new ProductSearchCriteria(null, null, ProductSort.PRICE_ASC, 0, 5, false), p -> p)
                    .getContent().stream().map(p -> p.getId()).toList();
            assertThat(cheapestFirst.get(0)).isEqualTo(combo);
        } finally {
            admin.setSale(combo, 0, ADMIN);
        }
    }

    @Test
    void salePercentMustBeBetweenZeroAndNinety() {
        UUID combo = productId("combo-tet-sum-vay");
        assertThatThrownBy(() -> admin.setSale(combo, 91, ADMIN)).hasFieldOrPropertyWithValue("code", "SALE_PERCENT_INVALID");
        assertThatThrownBy(() -> admin.setSale(combo, -1, ADMIN)).hasFieldOrPropertyWithValue("code", "SALE_PERCENT_INVALID");
    }
}
