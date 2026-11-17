package com.vietnl.hwin.catalog.api.dto;

import com.vietnl.hwin.catalog.api.dto.FoodInfoResponse;
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
public class SaveProductRequest {

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
    @NotBlankValidator(field = "Thương hiệu")
    @LengthValidator(max = 100, field = "Thương hiệu")
    private String brand;
    @NotBlankValidator(field = "Khối lượng")
    @LengthValidator(max = 50, field = "Khối lượng")
    private String weight;
    @NotBlankValidator(field = "Đóng gói")
    @LengthValidator(max = 100, field = "Đóng gói")
    private String packaging;
    @NotBlankValidator(field = "Xuất xứ")
    @LengthValidator(max = 100, field = "Xuất xứ")
    private String origin;
    @LengthValidator(max = 5000, field = "Thành phần")
    private String ingredients;
    @LengthValidator(max = 5000, field = "Đặc điểm")
    private String features;
    @LengthValidator(max = 5000, field = "Hướng dẫn sử dụng")
    private String usageInstructions;
    @PositiveOrZero
    private Integer initialStock;
    private boolean bestseller;
    @NotNullValidator(field = "Ảnh sản phẩm")
    @Size(min = 1, max = 5, message = "Sản phẩm cần từ 1 đến 5 ảnh")
    private List<@NotBlank @Size(max = 500) String> images;
    @Valid
    private FoodInfoResponse foodInfo;
}
