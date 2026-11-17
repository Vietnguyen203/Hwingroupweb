package com.vietnl.hwin.ordering.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotBlankValidator;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
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
public class VatInvoiceRequest {

    @NotBlankValidator(field = "Tên công ty")
    @LengthValidator(max = 255, field = "Tên công ty")
    private String companyName;
    @NotBlankValidator(field = "taxCode")
    @Pattern(regexp = "^\\d{10}(-\\d{3})?$", message = "Mã số thuế gồm 10 số (hoặc 10 số-3 số)")
    private String taxCode;
    @NotBlankValidator(field = "Địa chỉ")
    @LengthValidator(max = 500, field = "Địa chỉ")
    private String address;
    @NotBlankValidator(field = "Email")
    @LengthValidator(max = 255, field = "Email")
    private String email;
}
