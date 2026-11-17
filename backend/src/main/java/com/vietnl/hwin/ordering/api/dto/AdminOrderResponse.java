package com.vietnl.hwin.ordering.api.dto;

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

/** Chi tiết cho admin: thêm id, khách, mã CTV, mã giao dịch, lịch sử trạng thái. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderResponse {

    private UUID id;
    private UUID customerId;
    private String referralCode;
    private String paymentRef;
    private OrderDetailResponse detail;
    private List<OrderStatusHistoryResponse> history;
}
