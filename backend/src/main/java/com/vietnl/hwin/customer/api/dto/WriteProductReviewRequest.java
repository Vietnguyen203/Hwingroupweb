package com.vietnl.hwin.customer.api.dto;

import java.util.UUID;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotNullValidator;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Khách viết đánh giá: số sao 1–5 + nội dung (không bắt buộc, tối đa 1000 ký tự). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteProductReviewRequest {

    @NotNullValidator(field = "Sản phẩm")
    private UUID productId;
    @NotNullValidator(field = "Số sao")
    @Min(value = 1, message = "Số sao đánh giá phải từ 1 đến 5")
    @Max(value = 5, message = "Số sao đánh giá phải từ 1 đến 5")
    private Integer rating;
    @LengthValidator(max = 1000, field = "Nội dung đánh giá")
    private String comment;
}
