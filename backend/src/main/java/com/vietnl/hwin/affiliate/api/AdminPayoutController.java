package com.vietnl.hwin.affiliate.api;

import org.springframework.http.ResponseEntity;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.affiliate.api.dto.AdminAffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.AdminCommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.AdminPayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.CommissionApprovalJobResponse;
import com.vietnl.hwin.affiliate.api.dto.MarkPayoutPaidRequest;
import com.vietnl.hwin.affiliate.api.dto.PayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.ChangeStatusRequest;
import com.vietnl.hwin.affiliate.api.mapper.AffiliateMapper;
import com.vietnl.hwin.affiliate.entity.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.PayoutStatus;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.job.CommissionApprovalJob;
import com.vietnl.hwin.affiliate.service.CommissionQueryService;
import com.vietnl.hwin.affiliate.service.PayoutService;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Admin: duyệt CTV, xem hoa hồng, duyệt / chi trả rút tiền. */
@Tag(name = "affiliate-admin")
@RestController
@RequestMapping("/api/admin/payouts")
public class AdminPayoutController {

    private final PayoutService payouts;
    private final AffiliateMapper mapper;

    public AdminPayoutController(PayoutService payouts, AffiliateMapper mapper) {
        this.payouts = payouts;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<PayoutResponse>> payouts(@RequestParam(required = false) PayoutStatus status,
                                                @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(payouts.search(status, page, size, mapper::toResponse), x -> x));
    }
    /** Chi tiết + số tài khoản đã giải mã (mỗi lần xem ghi audit BANK_VIEWED). */
    @GetMapping("/{id}")
    public ResponseEntity<AdminPayoutResponse> payout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(mapper.toAdmin(payouts.getForAdmin(id, me.userId())));
    }
    @PostMapping("/{id}/approve")
    public ResponseEntity<PayoutResponse> approvePayout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.approve(id, me.userId(), mapper::toResponse));
    }
    @PostMapping("/{id}/pay")
    public ResponseEntity<PayoutResponse> pay(@PathVariable UUID id, @Valid @RequestBody MarkPayoutPaidRequest r,
                              @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.markPaid(id, r.getTransactionRef(), me.userId(), mapper::toResponse));
    }
    @PostMapping("/{id}/reject")
    public ResponseEntity<PayoutResponse> rejectPayout(@PathVariable UUID id, @Valid @RequestBody ChangeStatusRequest r,
                                       @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.reject(id, r.getReason(), me.userId(), mapper::toResponse));
    }
}
