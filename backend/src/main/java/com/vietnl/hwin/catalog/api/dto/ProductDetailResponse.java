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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {

    private UUID id;
    private String name;
    private String slug;
    private long price;
    private Long compareAtPrice;
    private int discountPercent;
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
    private boolean inStock;
    private int stock;
    private boolean bestseller;
    private int soldCount;
    private List<String> images;
    private FoodInfoResponse foodInfo;
    private CategoryResponse category;
}
