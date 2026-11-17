package com.vietnl.hwin.affiliate.api;

import com.vietnl.hwin.affiliate.service.model.AffiliateDashboard;
import com.vietnl.hwin.affiliate.service.model.BoundCustomer;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.affiliate.api.dto.AffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.UpdateBankAccountRequest;
import com.vietnl.hwin.affiliate.api.dto.CommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.BankAccountOtpResponse;
import com.vietnl.hwin.affiliate.api.dto.CreatePayoutRequest;
import com.vietnl.hwin.affiliate.api.dto.PayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.RegisterAffiliateRequest;
import com.vietnl.hwin.affiliate.api.mapper.AffiliateMapper;
import com.vietnl.hwin.affiliate.service.AffiliateDashboardService;
import com.vietnl.hwin.affiliate.service.model.BoundCustomer;
import com.vietnl.hwin.affiliate.service.model.AffiliateDashboard;
import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.affiliate.service.PayoutService;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * API của cộng tác viên. register/me cần đăng nhập (CUSTOMER); các API còn lại cần vai trò AFFILIATE
 * (chặn ở SecurityConfig). Mọi dữ liệu lấy theo userId trong JWT.
 */
@Tag(name = "affiliate-ctv")
@RestController
@RequestMapping("/api/affiliates/me")
public class AffiliateController {

    private final AffiliateService affiliates;
    private final AffiliateDashboardService dashboards;
    private final PayoutService payouts;
    private final AffiliateProperties props;
    private final AffiliateMapper mapper;

    public AffiliateController(AffiliateService affiliates, AffiliateDashboardService dashboards, PayoutService payouts,
                         AffiliateProperties props, AffiliateMapper mapper) {
        this.affiliates = affiliates;
        this.dashboards = dashboards;
        this.payouts = payouts;
        this.props = props;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<AffiliateResponse> register(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody RegisterAffiliateRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(affiliates.register(me.userId(), r.getFullName(), r.getSocialLink(), r.getNote(), r.getPhone(),
                a -> mapper.toResponse(a, props.bankChangeLock())));
    }

    @GetMapping
    public ResponseEntity<AffiliateResponse> me(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(affiliates.me(me.userId(), a -> mapper.toResponse(a, props.bankChangeLock())));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AffiliateDashboard> dashboard(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(dashboards.dashboard(me.userId()));
    }

    @GetMapping("/commissions")
    public ResponseEntity<PageResponse<CommissionResponse>> commissions(@AuthenticationPrincipal AuthPrincipal me,
                                                        @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                        @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(dashboards.commissions(me.userId(), page, size, mapper::toResponse), x -> x));
    }

    @GetMapping("/customers")
    public ResponseEntity<PageResponse<BoundCustomer>> customers(@AuthenticationPrincipal AuthPrincipal me,
                                                 @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                 @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(dashboards.customers(me.userId(), page, size), x -> x));
    }

    @GetMapping("/bank-account")
    public ResponseEntity<AffiliateResponse> bankAccount(@AuthenticationPrincipal AuthPrincipal me) {
        return me(me);
    }

    /** Gửi OTP tới SĐT của CTV – bắt buộc trước khi đổi tài khoản ngân hàng. */
    @PostMapping("/bank-account/otp")
    public ResponseEntity<BankAccountOtpResponse> bankOtp(@AuthenticationPrincipal AuthPrincipal me, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new BankAccountOtpResponse(affiliates.sendBankChangeOtp(me.userId(), ClientInfo.from(request).ipHash())));
    }

    @PutMapping("/bank-account")
    public ResponseEntity<AffiliateResponse> changeBank(@AuthenticationPrincipal AuthPrincipal me,
                                        @Valid @RequestBody UpdateBankAccountRequest r) {
        return ResponseEntity.ok(affiliates.changeBankAccount(me.userId(), r.getBankName(), r.getAccountNo(), r.getAccountHolder(), r.getOtp(),
                a -> mapper.toResponse(a, props.bankChangeLock())));
    }

    @GetMapping("/payouts")
    public ResponseEntity<PageResponse<PayoutResponse>> payouts(@AuthenticationPrincipal AuthPrincipal me,
                                                @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(payouts.listMine(me.userId(), page, size, mapper::toResponse), x -> x));
    }

    @PostMapping("/payouts")
    public ResponseEntity<PayoutResponse> requestPayout(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody CreatePayoutRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payouts.request(me.userId(), r.getAmount(), mapper::toResponse));
    }
}
