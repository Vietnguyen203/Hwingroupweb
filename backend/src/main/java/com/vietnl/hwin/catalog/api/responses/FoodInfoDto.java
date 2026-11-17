package com.vietnl.hwin.catalog.api.responses;

import com.vietnl.hwin.common.validation.LengthValidator;
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
public class FoodInfoDto {

    @LengthValidator(max = 200, field = "Nhà sản xuất")
    private String manufacturer;
    @LengthValidator(max = 100, field = "Hạn sử dụng")
    private String shelfLife;
    @LengthValidator(max = 1000, field = "Hướng dẫn bảo quản")
    private String storageInstructions;
    @LengthValidator(max = 100, field = "Số tự công bố")
    private String declarationNumber;
    @LengthValidator(max = 100, field = "Số giấy chứng nhận ATTP")
    private String foodSafetyCertNumber;
    @LengthValidator(max = 500, field = "Link giấy chứng nhận ATTP")
    private String foodSafetyCertUrl;
}
