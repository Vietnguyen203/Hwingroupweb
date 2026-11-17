package com.vietnl.hwin.catalog.api.dto;

import com.vietnl.hwin.common.validation.NotNullValidator;
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
public class AdjustStockRequest {

    @NotNullValidator(field = "Số lượng điều chỉnh")
    @Min(-100000)
    @Max(100000)
    private Integer delta;
}
