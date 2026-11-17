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

/** Dòng sản phẩm trong trang admin. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductResponse {

    private UUID id;
    private UUID categoryId;
    private String name;
    private String slug;
    /** Giá niêm yết (chưa tính giảm giá thêm) – dùng để sửa sản phẩm. */
    private long price;
    /** Giảm giá thêm (%) – đặt bằng PATCH /api/admin/products/{id}/sale. */
    private int salePercent;
    /** Giá khách thực trả sau giảm giá thêm. */
    private long effectivePrice;
    private Long compareAtPrice;
    private String shortDescription;
    private String description;
    private String unit;
    private String brand;
    private String weight;
    private String packaging;
    private String origin;
    private String ingredients;
    private String features;
    private String usageInstructions;
    private int stock;
    private boolean active;
    private boolean bestseller;
    private int soldCount;
    private List<String> images;
    private FoodInfoResponse foodInfo;
}
