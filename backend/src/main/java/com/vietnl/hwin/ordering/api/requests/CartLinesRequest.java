package com.vietnl.hwin.ordering.api.requests;

import com.vietnl.hwin.common.validation.NotNullValidator;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Giỏ localStorage gửi lên để gộp (merge) hoặc tính giá (quote). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartLinesRequest {

    @NotNullValidator(field = "items")
    @Size(max = 50)
    private List<@Valid CartItemRequest> items;
}
