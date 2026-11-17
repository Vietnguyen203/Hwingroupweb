package com.vietnl.hwin.customer.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import jakarta.validation.constraints.Pattern;
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
public class AddressRequest {

    @NotBlankValidator(field = "Người nhận")
    @LengthValidator(max = 100, field = "Người nhận")
    private String recipientName;
    @NotBlankValidator(field = "Số điện thoại người nhận")
    @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ")
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
    private boolean makeDefault;
}
