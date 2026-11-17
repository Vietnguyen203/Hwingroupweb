package com.vietnl.hwin.catalog.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
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
public class CategoryUpsertRequest {

    @NotBlankValidator(field = "Tên")
    @LengthValidator(max = 100, field = "Tên")
    private String name;
    @LengthValidator(max = 120, field = "Slug")
    private String slug;
    @LengthValidator(max = 500, field = "Icon")
    private String iconUrl;
    @Min(0)
    @Max(1000)
    private int sortOrder;
    private boolean active;
}
