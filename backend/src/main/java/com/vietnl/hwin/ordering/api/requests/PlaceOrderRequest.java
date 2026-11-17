package com.vietnl.hwin.ordering.api.requests;

import com.vietnl.hwin.common.validation.LengthValidator;
import com.vietnl.hwin.common.validation.NotNullValidator;
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

/**
 * @param idempotencyKey chuỗi ngẫu nhiên do client sinh cho mỗi lần bấm "Đặt hàng" – gửi lại cùng key
 *                       (mạng chập chờn) sẽ nhận lại đúng đơn cũ thay vì tạo đơn trùng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {

    @NotNullValidator(field = "Địa chỉ giao hàng")
    @Valid
    private AddressRequest shippingAddress;
    @NotNullValidator(field = "Phương thức thanh toán")
    private PaymentMethod paymentMethod;
    @Valid
    private VatInvoiceRequest vatInvoice;
    @LengthValidator(max = 500, field = "Ghi chú")
    private String note;
    @LengthValidator(max = 64, field = "Mã chống trùng")
    private String idempotencyKey;
}
