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

    @Test
    void saleIsAppliedOnTopOfListPrice() {
        // combo niêm yết 1.000.000đ (đã trừ 10% combo) + giảm thêm 15% -> khách trả 850.000đ
        ProductDetails d = new ProductDetails(UUID.randomUUID(), "Combo", null, Money.of(1_000_000), null, null, null, "combo",
                "HWIN", "3 món", "Hộp", "Việt Nam", null, null, null, null);
        Product combo = Product.create(d, 5, images(1));
        assertThat(combo.getEffectivePrice().amount()).isEqualTo(1_000_000);
        assertThat(combo.discountPercent()).isZero();

        combo.changeSalePercent(15);
        assertThat(combo.getEffectivePrice().amount()).isEqualTo(850_000);
        assertThat(combo.displayCompareAtPrice().amount()).isEqualTo(1_000_000); // gạch ngang giá niêm yết
        assertThat(combo.discountPercent()).isEqualTo(15);

        combo.changeSalePercent(0);
        assertThat(combo.getEffectivePrice().amount()).isEqualTo(1_000_000);
        assertThat(combo.displayCompareAtPrice()).isNull();
    }

    @Test
    void saleKeepsOriginalCompareAtPriceAndRecalculatesWhenPriceChanges() {
        ProductDetails d = new ProductDetails(UUID.randomUUID(), "Combo", null, Money.of(1_000_000), Money.of(1_111_112), null, null, "combo",
                "HWIN", "3 món", "Hộp", "Việt Nam", null, null, null, null);
        Product combo = Product.create(d, 5, images(1));
        combo.changeSalePercent(15);
        assertThat(combo.displayCompareAtPrice().amount()).isEqualTo(1_111_112); // giữ giá gốc tổng các món
        assertThat(combo.discountPercent()).isEqualTo(24); // (1.111.112 - 850.000) / 1.111.112

        combo.updateDetails(new ProductDetails(d.categoryId(), "Combo", null, Money.of(2_000_000), null, null, null, "combo",
                "HWIN", "3 món", "Hộp", "Việt Nam", null, null, null, null));
        assertThat(combo.getEffectivePrice().amount()).isEqualTo(1_700_000); // vẫn giảm 15% trên giá mới
    }

    @Test
    void salePercentLimits() {
        Product p = Product.create(valid(), 1, images(1));
        assertThatThrownBy(() -> p.changeSalePercent(-1)).hasFieldOrPropertyWithValue("code", "SALE_PERCENT_INVALID");
        assertThatThrownBy(() -> p.changeSalePercent(91)).hasFieldOrPropertyWithValue("code", "SALE_PERCENT_INVALID");
        p.changeSalePercent(90);
        assertThat(p.getEffectivePrice().amount()).isEqualTo(9_500);
    }
}
