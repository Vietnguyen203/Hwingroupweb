package com.vietnl.hwin.affiliate.api;

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

import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminAffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminCommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminPayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.ApprovalJobResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.PayRequest;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.PayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.ReasonRequest;
import com.vietnl.hwin.affiliate.api.mapper.AffiliateMapper;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.PayoutStatus;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.CommissionApprovalJob;
import com.vietnl.hwin.affiliate.service.CommissionQueryService;
import com.vietnl.hwin.affiliate.service.PayoutService;
import com.vietnl.hwin.common.exception.NotFoundException;
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
    public PageResponse<AdminAffiliateResponse> list(@RequestParam(required = false) AffiliateStatus status,
                                                     @RequestParam(required = false) String q,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(affiliates.search(status, q, page, size, mapper::toAdmin), x -> x);
    }

    @GetMapping("/affiliates/{id}")
    public AdminAffiliateResponse get(@PathVariable UUID id) {
        return affiliates.get(id, mapper::toAdmin);
    }

    @PostMapping("/affiliates/{id}/approve")
    public AdminAffiliateResponse approve(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return affiliates.approve(id, me.userId(), mapper::toAdmin);
    }

    @PostMapping("/affiliates/{id}/reject")
    public AdminAffiliateResponse reject(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                         @AuthenticationPrincipal AuthPrincipal me) {
        return affiliates.reject(id, r.reason(), me.userId(), mapper::toAdmin);
    }

    @PostMapping("/affiliates/{id}/suspend")
    public AdminAffiliateResponse suspend(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                          @AuthenticationPrincipal AuthPrincipal me) {
        return affiliates.suspend(id, r.reason(), me.userId(), mapper::toAdmin);
    }

    @PostMapping("/affiliates/{id}/reinstate")
    public AdminAffiliateResponse reinstate(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return affiliates.reinstate(id, me.userId(), mapper::toAdmin);
    }

    // ------------------------------------------------------------------ hoa hồng

    @GetMapping("/commissions")
    public PageResponse<AdminCommissionResponse> commissions(@RequestParam(required = false) CommissionStatus status,
                                                             @RequestParam(required = false) UUID affiliateId,
                                                             @RequestParam(required = false) String orderCode,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(commissionQuery.search(status, affiliateId, orderCode, page, size, mapper::toAdmin), x -> x);
    }

    /**
     * Chạy ngay job duyệt hoa hồng. Tham số {@code asOf} (giả lập thời điểm, ví dụ +8 ngày) chỉ dùng được khi
     * hwin.affiliate.simulated-time-enabled=true (profile dev) – để demo không phải chờ 7 ngày.
     */
    @PostMapping("/commissions/run-approval-job")
    public ApprovalJobResponse runApprovalJob(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {
        if (asOf != null && !props.simulatedTimeEnabled()) {
            throw new NotFoundException("Không hỗ trợ giả lập thời điểm ở môi trường này");
        }
        Instant when = asOf != null ? asOf : Instant.now();
        return new ApprovalJobResponse(when, approvalJob.approveDue(when));
    }

    // ------------------------------------------------------------------ rút tiền

    @GetMapping("/payouts")
    public PageResponse<PayoutResponse> payouts(@RequestParam(required = false) PayoutStatus status,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(payouts.search(status, page, size, mapper::toResponse), x -> x);
    }

    /** Chi tiết + số tài khoản đã giải mã (mỗi lần xem ghi audit BANK_VIEWED). */
    @GetMapping("/payouts/{id}")
    public AdminPayoutResponse payout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return mapper.toAdmin(payouts.getForAdmin(id, me.userId()));
    }

    @PostMapping("/payouts/{id}/approve")
    public PayoutResponse approvePayout(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return payouts.approve(id, me.userId(), mapper::toResponse);
    }

    @PostMapping("/payouts/{id}/pay")
    public PayoutResponse pay(@PathVariable UUID id, @Valid @RequestBody PayRequest r,
                              @AuthenticationPrincipal AuthPrincipal me) {
        return payouts.markPaid(id, r.transactionRef(), me.userId(), mapper::toResponse);
    }

    @PostMapping("/payouts/{id}/reject")
    public PayoutResponse rejectPayout(@PathVariable UUID id, @Valid @RequestBody ReasonRequest r,
                                       @AuthenticationPrincipal AuthPrincipal me) {
        return payouts.reject(id, r.reason(), me.userId(), mapper::toResponse);
    }
}
