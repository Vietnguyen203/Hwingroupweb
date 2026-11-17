package com.vietnl.hwin.customer.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotNullValidator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReviewVisibilityRequest {

    /** true = hiện trên trang sản phẩm, false = ẩn. */
    @NotNullValidator(field = "Trạng thái hiển thị")
    private Boolean visible;
    /** Lý do ẩn / hiện (không bắt buộc, lưu vào nhật ký). */
    @LengthValidator(max = 500, field = "Lý do")
    private String reason;
}
