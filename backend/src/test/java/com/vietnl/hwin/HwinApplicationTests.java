package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.UnauthorizedException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.IssuedTokens;
import com.vietnl.hwin.identity.service.TokenService;
import com.vietnl.hwin.identity.service.UserAccountService;

/**
 * Khởi động toàn bộ ứng dụng với Postgres/Redis thật (Testcontainers):
 * kiểm tra Flyway + Hibernate validate + dữ liệu mẫu + tìm kiếm không dấu.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class HwinApplicationTests {

    @Autowired
    ProductSearchService searchService;

    @Autowired
    UserAccountService userAccountService;

    @Autowired
    TokenService tokenService;

    @Test
    void contextLoads() {
    }

    @Test
    void searchWithoutDiacriticsFindsVietnameseProducts() {
        Page<String> result = searchService.search(
                new ProductSearchCriteria("cha lua", null, ProductSort.NEWEST, 0, 20, true), p -> p.getName());
        assertThat(result.getContent()).contains("Chả lụa truyền thống 500g");

        Page<String> accented = searchService.search(
                new ProductSearchCriteria("Lạp Xưởng", null, ProductSort.NEWEST, 0, 20, true), p -> p.getName());
        assertThat(accented.getContent()).contains("Lạp xưởng tươi 500g").doesNotContain("Giò thủ 500g");
    }

    @Test
    void filterByCategoryAndSortByPrice() {
        Page<Long> prices = searchService.search(
                new ProductSearchCriteria(null, "cha-gio", ProductSort.PRICE_ASC, 0, 20, true),
                p -> p.getPrice().amount());
        assertThat(prices.getContent()).containsExactly(95000L, 105000L, 120000L);
    }

    @Test
    void refreshTokenRotationDetectsReuse() {
        ClientInfo client = new ClientInfo("127.0.0.1", "junit");
        UserAccount user = userAccountService.loginByPhone(PhoneNumber.of("0988000111"));
        IssuedTokens first = tokenService.issue(user, client);

        IssuedTokens second = tokenService.rotate(first.refreshToken(), client);
        assertThat(second.refreshToken()).isNotEqualTo(first.refreshToken());

        // Dùng lại token cũ -> bị từ chối và thu hồi cả chuỗi (kể cả token mới)
        assertThatThrownBy(() -> tokenService.rotate(first.refreshToken(), client))
                .isInstanceOf(UnauthorizedException.class).hasFieldOrPropertyWithValue("code", "REFRESH_REUSED");
        assertThatThrownBy(() -> tokenService.rotate(second.refreshToken(), client))
                .isInstanceOf(UnauthorizedException.class);
    }
}
