package com.vietnl.hwin.affiliate.api;

import com.vietnl.hwin.common.exception.CommonErrorMessage;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.storage.PrivateFileStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/admin/affiliates")
public class AdminAffiliateController {

    private final AffiliateAdminService affiliates;
    private final AffiliateMapper mapper;

    public AdminAffiliateController(AffiliateAdminService affiliates, AffiliateMapper mapper) {
        this.affiliates = affiliates;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminAffiliateResponse>> list(@RequestParam(required = false) AffiliateStatus status,
                                                     @RequestParam(required = false) String q,
                                                     @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                     @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(affiliates.search(status, q, page, size, mapper::toAdmin), x -> x));
    }
    @GetMapping("/{id}")
    public ResponseEntity<AdminAffiliateResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(affiliates.get(id, mapper::toAdmin));
    }
    /** Ảnh CCCD (chỉ ADMIN; không cache). side = front | back. */
    @GetMapping("/{id}/id-card/{side}")
    public ResponseEntity<byte[]> idCard(@PathVariable UUID id, @PathVariable String side, @AuthenticationPrincipal AuthPrincipal me) {
        if (!side.equals("front") && !side.equals("back")) {
            throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.NOT_FOUND);
        }
        PrivateFileStore.StoredFile f = affiliates.idCardImage(id, side.equals("front"), me.userId());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.contentType()))
                .header("Cache-Control", "no-store").header("X-Content-Type-Options", "nosniff").body(f.content());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AdminAffiliateResponse> approve(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.approve(id, me.userId(), mapper::toAdmin));
    }
    @PostMapping("/{id}/reject")
    public ResponseEntity<AdminAffiliateResponse> reject(@PathVariable UUID id, @Valid @RequestBody ChangeStatusRequest r,
                                         @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.reject(id, r.getReason(), me.userId(), mapper::toAdmin));
    }
    @PostMapping("/{id}/suspend")
    public ResponseEntity<AdminAffiliateResponse> suspend(@PathVariable UUID id, @Valid @RequestBody ChangeStatusRequest r,
                                          @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.suspend(id, r.getReason(), me.userId(), mapper::toAdmin));
    }
    @PostMapping("/{id}/reinstate")
    public ResponseEntity<AdminAffiliateResponse> reinstate(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.reinstate(id, me.userId(), mapper::toAdmin));
    }
}
