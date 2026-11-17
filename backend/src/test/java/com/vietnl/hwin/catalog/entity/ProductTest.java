package com.vietnl.hwin.catalog.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.vietnl.hwin.common.domain.Money;

/** Sản phẩm: 1–5 ảnh, thương hiệu / khối lượng / đóng gói / xuất xứ bắt buộc. */
class ProductTest {

    private static ProductDetails details(String brand, String weight, String packaging, String origin) {
        return new ProductDetails(UUID.randomUUID(), "Chả lụa", null, Money.of(95_000), null, null, null, "đòn",
                brand, weight, packaging, origin, "Thịt heo", "Dai giòn", "Cắt lát", null);
    }

    private static ProductDetails valid() {
        return details("HWIN Food", "500g", "Gói hút chân không", "Việt Nam");
    }

    private static List<String> images(int n) {
        return java.util.stream.IntStream.rangeClosed(1, n).mapToObj(i -> "/img/" + i + ".png").toList();
    }

    @Test
    void imagesMustBeBetweenOneAndFive() {
        assertThatThrownBy(() -> Product.create(valid(), 10, List.of()))
                .hasFieldOrPropertyWithValue("code", "PRODUCT_IMAGE_REQUIRED");
        assertThatThrownBy(() -> Product.create(valid(), 10, List.of(" ", "")))
                .hasFieldOrPropertyWithValue("code", "PRODUCT_IMAGE_REQUIRED");
        assertThatThrownBy(() -> Product.create(valid(), 10, images(6)))
                .hasFieldOrPropertyWithValue("code", "TOO_MANY_IMAGES");

        assertThat(Product.create(valid(), 10, images(1)).getImages()).hasSize(1);
        Product five = Product.create(valid(), 10, images(5));
        assertThat(five.getImages()).hasSize(5);
        assertThat(five.mainImageUrl()).isEqualTo("/img/1.png");
    }

    @Test
    void basicInfoIsRequired() {
        assertThatThrownBy(() -> Product.create(details(" ", "500g", "Gói", "Việt Nam"), 1, images(1)))
                .hasMessageContaining("Thương hiệu");
        assertThatThrownBy(() -> Product.create(details("HWIN", null, "Gói", "Việt Nam"), 1, images(1)))
                .hasMessageContaining("Khối lượng");
        assertThatThrownBy(() -> Product.create(details("HWIN", "500g", "", "Việt Nam"), 1, images(1)))
                .hasMessageContaining("Đóng gói");
        assertThatThrownBy(() -> Product.create(details("HWIN", "500g", "Gói", null), 1, images(1)))
                .hasMessageContaining("Xuất xứ");

        Product p = Product.create(details(" HWIN Food ", "500g", "Gói", "Việt Nam"), 1, images(1));
        assertThat(p.getBrand()).isEqualTo("HWIN Food");
        assertThat(p.getIngredients()).isEqualTo("Thịt heo");
    }
}
