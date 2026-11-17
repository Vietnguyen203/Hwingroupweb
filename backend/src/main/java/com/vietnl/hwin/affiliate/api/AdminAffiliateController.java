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

import com.vietnl.hwin.affiliate.api.responses.AdminAffiliateResponse;
import com.vietnl.hwin.affiliate.api.responses.AdminCommissionResponse;
import com.vietnl.hwin.affiliate.api.responses.AdminPayoutResponse;
import com.vietnl.hwin.affiliate.api.responses.ApprovalJobResponse;
import com.vietnl.hwin.affiliate.api.requests.PayRequest;
import com.vietnl.hwin.affiliate.api.responses.PayoutResponse;
import com.vietnl.hwin.affiliate.api.requests.ReasonRequest;
import com.vietnl.hwin.affiliate.api.mapper.AffiliateMapper;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.PayoutStatus;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.CommissionApprovalJob;
import com.vietnl.hwin.affiliate.service.CommissionQueryService;
import com.vietnl.hwin.affiliate.service.PayoutService;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Admin: duyệt CTV, xem hoa hồng, duyệt / chi trả rút tiền. */
@Tag(name = "affiliate-admin")
@RestController
@RequestMapping("/api/admin")
public class AdminAffiliateController {

    private final AffiliateAdminService affiliates;
    private final CommissionQueryService commissionQuery;
    private final CommissionApprovalJob approvalJob;
    private final PayoutService payouts;
    private final AffiliateProperties props;
    private final AffiliateMapper mapper;

    public AdminAffiliateController(AffiliateAdminService affiliates, CommissionQueryService commissionQuery,
                                    CommissionApprovalJob approvalJob, PayoutService payouts,
                                    AffiliateProperties props, AffiliateMapper mapper) {
        this.affiliates = affiliates;
        this.commissionQuery = commissionQuery;
        this.approvalJob = approvalJob;
        this.payouts = payouts;
        this.props = props;
        this.mapper = mapper;
    }

    // ------------------------------------------------------------------ CTV

    @GetMapping("/affiliates")
    public ResponseEntity<PageResponse<AdminAffiliateResponse>> list(@RequestParam(required = false) AffiliateStatus status,
                                                     @RequestParam(required = false) String q,
                                                     @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                     @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(affiliates.search(status, q, page, size, mapper::toAdmin), x -> x));
    }

    @GetMapping("/affiliates/{id}")
    public ResponseEntity<AdminAffiliateResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(affiliates.get(id, mapper::toAdmin));
    }

    @PostMapping("/affiliates/{id}/approve")
    public ResponseEntity<AdminAffiliateResponse> approve(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.approve(id, me.userId(), mapper::toAdmin));
    }

    @PostMapping("/affiliates/{id}/reject")
    public ResponseEntity<AdminAffiliateResponse> reject(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                         @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.reject(id, r.getReason(), me.userId(), mapper::toAdmin));
    }

    @PostMapping("/affiliates/{id}/suspend")
    public ResponseEntity<AdminAffiliateResponse> suspend(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                          @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.suspend(id, r.getReason(), me.userId(), mapper::toAdmin));
    }

    @PostMapping("/affiliates/{id}/reinstate")
    public ResponseEntity<AdminAffiliateResponse> reinstate(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.reinstate(id, me.userId(), mapper::toAdmin));
    }

    // ------------------------------------------------------------------ hoa hồng

    @GetMapping("/commissions")
    public ResponseEntity<PageResponse<AdminCommissionResponse>> commissions(@RequestParam(required = false) CommissionStatus status,
                                                             @RequestParam(required = false) UUID affiliateId,
                                                             @RequestParam(required = false) String orderCode,
                                                             @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                             @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(commissionQuery.search(status, affiliateId, orderCode, page, size, mapper::toAdmin), x -> x));
    }

    /**
     * Chạy ngay job duyệt hoa hồng. Tham số {@code asOf} (giả lập thời điểm, ví dụ +8 ngày) chỉ dùng được khi
     * hwin.affiliate.simulated-time-enabled=true (profile dev) – để demo không phải chờ 7 ngày.
     */
    @PostMapping("/commissions/run-approval-job")
    public ResponseEntity<ApprovalJobResponse> runApprovalJob(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {
        if (asOf != null && !props.simulatedTimeEnabled()) {
            throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.SIMULATED_TIME_DISABLED);
        }
        Instant when = asOf != null ? asOf : Instant.now();
        return ResponseEntity.ok(new ApprovalJobResponse(when, approvalJob.approveDue(when)));
    }

    // ------------------------------------------------------------------ rút tiền

    @GetMapping("/payouts")
    public ResponseEntity<PageResponse<PayoutResponse>> payouts(@RequestParam(required = false) PayoutStatus status,
                                                @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(payouts.search(status, page, size, mapper::toResponse), x -> x));
    }

    /** Chi tiết + số tài khoản đã giải mã (mỗi lần xem ghi audit BANK_VIEWED). */
    @GetMapping("/payouts/{id}")
    public ResponseEntity<AdminPayoutResponse> payout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(mapper.toAdmin(payouts.getForAdmin(id, me.userId())));
    }

    @PostMapping("/payouts/{id}/approve")
    public ResponseEntity<PayoutResponse> approvePayout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.approve(id, me.userId(), mapper::toResponse));
    }

    @PostMapping("/payouts/{id}/pay")
    public ResponseEntity<PayoutResponse> pay(@PathVariable UUID id, @Valid @RequestBody PayRequest r,
                              @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.markPaid(id, r.getTransactionRef(), me.userId(), mapper::toResponse));
    }

    @PostMapping("/payouts/{id}/reject")
    public ResponseEntity<PayoutResponse> rejectPayout(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                       @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(payouts.reject(id, r.getReason(), me.userId(), mapper::toResponse));
    }
}
