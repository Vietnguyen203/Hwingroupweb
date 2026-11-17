package com.vietnl.hwin.catalog.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thẻ sản phẩm trong danh sách. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCardResponse {

    private UUID id;
    private String name;
    private String slug;
    /** Giá khách thực trả (đã gồm giảm giá thêm). */
    private long price;
    /** Giá niêm yết trước khi giảm giá thêm. */
    private long basePrice;
    /** Giảm giá thêm (%) do admin đặt, 0 nếu không có. */
    private int salePercent;
    private Long compareAtPrice;
    private int discountPercent;
    private String imageUrl;
    private String unit;
    private boolean inStock;
    private boolean bestseller;
}
