package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.catalog.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Số sản phẩm đang bán theo danh mục (để trang chủ ẩn danh mục rỗng). */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class CategoryProductCountTests {

    @Autowired CategoryService categories;

    @Test
    void countsActiveProductsPerCategory() {
        var counts = categories.activeProductCounts();
        // dữ liệu mẫu V3_002: Chả & Giò có 3 sản phẩm, Combo có 1
        assertThat(counts.get(categories.getBySlug("cha-gio").getId())).isEqualTo(3L);
        assertThat(counts.get(categories.getBySlug("combo").getId())).isEqualTo(1L);
    }
}
