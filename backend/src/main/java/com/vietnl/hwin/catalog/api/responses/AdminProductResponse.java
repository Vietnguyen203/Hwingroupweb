package com.vietnl.hwin.catalog.api.responses;

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
    private long price;
    private Long compareAtPrice;
    private String shortDescription;
    private String description;
    private String unit;
    private int stock;
    private boolean active;
    private boolean bestseller;
    private int soldCount;
    private List<String> images;
    private FoodInfoDto foodInfo;
}
