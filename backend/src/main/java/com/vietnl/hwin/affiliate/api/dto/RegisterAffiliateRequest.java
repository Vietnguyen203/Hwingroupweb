package com.vietnl.hwin.affiliate.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAffiliateRequest {

    @NotBlankValidator(field = "Họ tên")
    @LengthValidator(max = 100, field = "Họ tên")
    private String fullName;
    @LengthValidator(max = 500, field = "Link mạng xã hội")
    private String socialLink;
    @LengthValidator(max = 1000, field = "Ghi chú")
    private String note;
    @AssertTrue(message = "Vui lòng đồng ý điều khoản cộng tác viên")
    private boolean acceptTerms;
    @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ")
    private String phone;
    /** Khóa ảnh CCCD mặt trước, nhận từ POST /api/affiliates/id-card-uploads. */
    @NotBlankValidator(field = "Ảnh CCCD mặt trước")
    private String idCardFrontKey;
    @NotBlankValidator(field = "Ảnh CCCD mặt sau")
    private String idCardBackKey;
}
