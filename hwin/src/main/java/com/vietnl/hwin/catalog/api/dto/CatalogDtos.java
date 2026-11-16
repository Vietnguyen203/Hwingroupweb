package com.vietnl.hwin.catalog.api.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** DTO của module catalog (request/response record). */
public final class CatalogDtos {

    private CatalogDtos() {
    }

    // ---------- Response ----------

    public record CategoryResponse(Long id, String name, String slug, String iconUrl, int sortOrder, boolean active) {
    }

    /** Thẻ sản phẩm trong danh sách. */
    public record ProductCardResponse(Long id, String name, String slug, long price, Long compareAtPrice,
                                      int discountPercent, String imageUrl, String unit, boolean inStock,
                                      boolean bestseller) {
    }

    public record FoodInfoDto(
            @Size(max = 200) String manufacturer,
            @Size(max = 100) String shelfLife,
            @Size(max = 1000) String storageInstructions,
            @Size(max = 100) String declarationNumber,
            @Size(max = 100) String foodSafetyCertNumber,
            @Size(max = 500) String foodSafetyCertUrl) {
    }

    public record ProductDetailResponse(Long id, String name, String slug, long price, Long compareAtPrice,
                                        int discountPercent, String shortDescription, String description,
                                        String unit, boolean inStock, int stock, boolean bestseller,
                                        List<String> images, FoodInfoDto foodInfo, CategoryResponse category) {
    }

    /** Dòng sản phẩm trong trang admin. */
    public record AdminProductResponse(Long id, Long categoryId, String name, String slug, long price,
                                       Long compareAtPrice, String shortDescription, String description,
                                       String unit, int stock, boolean active, boolean bestseller, int soldCount,
                                       List<String> images, FoodInfoDto foodInfo) {
    }

    // ---------- Request ----------

    public record CategoryUpsertRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 120) String slug,
            @Size(max = 500) String iconUrl,
            @Min(0) @Max(1000) int sortOrder,
            boolean active) {
    }

    public record ProductUpsertRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 200) String name,
            @Size(max = 220) String slug,
            @NotNull @Positive Long price,
            @Positive Long compareAtPrice,
            @Size(max = 500) String shortDescription,
            @Size(max = 20000) String description,
            @Size(max = 50) String unit,
            @PositiveOrZero Integer initialStock,
            boolean bestseller,
            @Size(max = 10) List<@NotBlank @Size(max = 500) String> images,
            @Valid FoodInfoDto foodInfo) {
    }

    public record StockAdjustRequest(@NotNull @Min(-100000) @Max(100000) Integer delta) {
    }

    public record ActiveRequest(boolean active) {
    }

    public record UploadResponse(String url) {
    }
}
