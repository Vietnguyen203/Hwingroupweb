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
@RequestMapping("/api/admin/commissions")
public class AdminCommissionController {

    private final CommissionQueryService commissionQuery;
    private final CommissionApprovalJob approvalJob;
    private final AffiliateProperties props;
    private final AffiliateMapper mapper;

    public AdminCommissionController(CommissionQueryService commissionQuery, CommissionApprovalJob approvalJob, AffiliateProperties props, AffiliateMapper mapper) {
        this.commissionQuery = commissionQuery;
        this.approvalJob = approvalJob;
        this.props = props;
        this.mapper = mapper;
    }

    @GetMapping
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
    @PostMapping("/run-approval-job")
    public ResponseEntity<CommissionApprovalJobResponse> runApprovalJob(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {
        if (asOf != null && !props.simulatedTimeEnabled()) {
            throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.SIMULATED_TIME_DISABLED);
        }
        Instant when = asOf != null ? asOf : Instant.now();
        return ResponseEntity.ok(new CommissionApprovalJobResponse(when, approvalJob.approveDue(when)));
    }
}
