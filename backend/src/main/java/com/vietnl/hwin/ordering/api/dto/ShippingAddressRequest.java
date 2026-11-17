package com.vietnl.hwin.ordering.api.dto;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.common.validation.ValidationPatterns;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
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
public class ShippingAddressRequest {

    @NotBlankValidator(field = "Người nhận")
    @LengthValidator(max = 100, field = "Người nhận")
    private String recipientName;
    @NotBlankValidator(field = "Số điện thoại người nhận")
    @Pattern(regexp = ValidationPatterns.PHONE, message = "Số điện thoại không hợp lệ")
    private String recipientPhone;
    @NotBlankValidator(field = "Tỉnh / Thành phố")
    @LengthValidator(max = 100, field = "Tỉnh / Thành phố")
    private String province;
    @NotBlankValidator(field = "Quận / Huyện")
    @LengthValidator(max = 100, field = "Quận / Huyện")
    private String district;
    @NotBlankValidator(field = "Phường / Xã")
    @LengthValidator(max = 100, field = "Phường / Xã")
    private String ward;
    @NotBlankValidator(field = "Số nhà, đường")
    @LengthValidator(max = 255, field = "Số nhà, đường")
    private String street;
}
