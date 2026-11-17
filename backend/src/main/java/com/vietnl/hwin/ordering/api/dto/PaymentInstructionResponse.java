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

/** Hướng dẫn chuyển khoản (chỉ có khi BANK_QR chưa thanh toán). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInstructionResponse {

    private String qrImageUrl;
    private String bankBin;
    private String accountNo;
    private String accountName;
    private long amount;
    private String transferContent;
}
