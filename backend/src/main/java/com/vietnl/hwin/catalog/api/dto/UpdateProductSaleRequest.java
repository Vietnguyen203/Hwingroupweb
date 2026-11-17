package com.vietnl.hwin.catalog.api.dto;

import com.vietnl.hwin.common.validation.NotNullValidator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductSaleRequest {

    /** Giảm giá thêm (%): số nguyên 0–90, 0 = bỏ giảm giá. */
    @NotNullValidator(field = "Phần trăm giảm giá")
    private Integer salePercent;
}
