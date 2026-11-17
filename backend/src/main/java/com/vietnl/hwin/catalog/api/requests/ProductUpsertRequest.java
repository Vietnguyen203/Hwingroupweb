package com.vietnl.hwin.catalog.api.requests;

import com.vietnl.hwin.catalog.api.responses.FoodInfoDto;
import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.common.validation.NotNullValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class ProductUpsertRequest {

    @NotNullValidator(field = "Danh mục")
    private UUID categoryId;
    @NotBlankValidator(field = "Tên")
    @LengthValidator(max = 200, field = "Tên")
    private String name;
    @LengthValidator(max = 220, field = "Slug")
    private String slug;
    @NotNullValidator(field = "Giá bán")
    @Positive
    private Long price;
    @Positive
    private Long compareAtPrice;
    @LengthValidator(max = 500, field = "Mô tả ngắn")
    private String shortDescription;
    @LengthValidator(max = 20000, field = "Mô tả")
    private String description;
    @LengthValidator(max = 50, field = "Đơn vị tính")
    private String unit;
    @PositiveOrZero
    private Integer initialStock;
    private boolean bestseller;
    @Size(max = 10)
    private List<@NotBlank @Size(max = 500) String> images;
    @Valid
    private FoodInfoDto foodInfo;
}
