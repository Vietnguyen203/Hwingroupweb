package com.vietnl.hwin.affiliate.api;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.BankAccountRequest;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.CommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.OtpSentResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.PayoutRequest;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.PayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.RegisterRequest;
import com.vietnl.hwin.affiliate.api.mapper.AffiliateMapper;
import com.vietnl.hwin.affiliate.service.AffiliateDashboardService;
import com.vietnl.hwin.affiliate.service.AffiliateDashboardService.BoundCustomer;
import com.vietnl.hwin.affiliate.service.AffiliateDashboardService.Dashboard;
import com.vietnl.hwin.affiliate.service.AffiliateProperties;
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
@RequestMapping("/api/ctv")
public class CtvController {

    private final AffiliateService affiliates;
    private final AffiliateDashboardService dashboards;
    private final PayoutService payouts;
    private final AffiliateProperties props;
    private final AffiliateMapper mapper;

    public CtvController(AffiliateService affiliates, AffiliateDashboardService dashboards, PayoutService payouts,
                         AffiliateProperties props, AffiliateMapper mapper) {
        this.affiliates = affiliates;
        this.dashboards = dashboards;
        this.payouts = payouts;
        this.props = props;
        this.mapper = mapper;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AffiliateResponse register(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody RegisterRequest r) {
        return affiliates.register(me.userId(), r.fullName(), r.socialLink(), r.note(), r.phone(),
                a -> mapper.toResponse(a, props.bankChangeLock()));
    }

    @GetMapping("/me")
    public AffiliateResponse me(@AuthenticationPrincipal AuthPrincipal me) {
        return affiliates.me(me.userId(), a -> mapper.toResponse(a, props.bankChangeLock()));
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard(@AuthenticationPrincipal AuthPrincipal me) {
        return dashboards.dashboard(me.userId());
    }

    @GetMapping("/commissions")
    public PageResponse<CommissionResponse> commissions(@AuthenticationPrincipal AuthPrincipal me,
                                                        @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                        @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return PageResponse.of(dashboards.commissions(me.userId(), page, size, mapper::toResponse), x -> x);
    }

    @GetMapping("/customers")
    public PageResponse<BoundCustomer> customers(@AuthenticationPrincipal AuthPrincipal me,
                                                 @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                 @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return PageResponse.of(dashboards.customers(me.userId(), page, size), x -> x);
    }

    @GetMapping("/bank-account")
    public AffiliateResponse bankAccount(@AuthenticationPrincipal AuthPrincipal me) {
        return me(me);
    }

    /** Gửi OTP tới SĐT của CTV – bắt buộc trước khi đổi tài khoản ngân hàng. */
    @PostMapping("/bank-account/otp")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public OtpSentResponse bankOtp(@AuthenticationPrincipal AuthPrincipal me, HttpServletRequest request) {
        return new OtpSentResponse(affiliates.sendBankChangeOtp(me.userId(), ClientInfo.from(request).ipHash()));
    }

    @PutMapping("/bank-account")
    public AffiliateResponse changeBank(@AuthenticationPrincipal AuthPrincipal me,
                                        @Valid @RequestBody BankAccountRequest r) {
        return affiliates.changeBankAccount(me.userId(), r.bankName(), r.accountNo(), r.accountHolder(), r.otp(),
                a -> mapper.toResponse(a, props.bankChangeLock()));
    }

    @GetMapping("/payouts")
    public PageResponse<PayoutResponse> payouts(@AuthenticationPrincipal AuthPrincipal me,
                                                @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return PageResponse.of(payouts.listMine(me.userId(), page, size, mapper::toResponse), x -> x);
    }

    @PostMapping("/payouts")
    @ResponseStatus(HttpStatus.CREATED)
    public PayoutResponse requestPayout(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody PayoutRequest r) {
        return payouts.request(me.userId(), r.amount(), mapper::toResponse);
    }
}
