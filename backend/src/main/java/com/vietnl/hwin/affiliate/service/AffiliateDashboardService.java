package com.vietnl.hwin.affiliate.service;

import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.model.AffiliateDashboard;
import com.vietnl.hwin.affiliate.service.model.BoundCustomer;
import com.vietnl.hwin.affiliate.service.model.CommissionStatusSummary;
import com.vietnl.hwin.affiliate.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.Commission;
import com.vietnl.hwin.affiliate.entity.CustomerBinding;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.affiliate.repository.CustomerBindingRepository;
import com.vietnl.hwin.affiliate.repository.PayoutRepository;
import com.vietnl.hwin.affiliate.repository.ReferralClickRepository;
import com.vietnl.hwin.identity.service.model.UserContact;
import com.vietnl.hwin.identity.service.UserQueryService;

/** AffiliateDashboard CTV: link, click, đơn, hoa hồng theo trạng thái, số dư, khách đã gắn. */
@Service
public class AffiliateDashboardService {

    private final AffiliateRepository affiliates;
    private final ReferralClickRepository clicks;
    private final CommissionRepository commissions;
    private final CustomerBindingRepository bindings;
    private final PayoutRepository payouts;
    private final PayoutService payoutService;
    private final UserQueryService users;
    private final AffiliateProperties props;
    private final Clock clock;

    public AffiliateDashboardService(AffiliateRepository affiliates, ReferralClickRepository clicks,
                                     CommissionRepository commissions, CustomerBindingRepository bindings,
                                     PayoutRepository payouts, PayoutService payoutService, UserQueryService users,
                                     AffiliateProperties props, Clock clock) {
        this.affiliates = affiliates;
        this.clicks = clicks;
        this.commissions = commissions;
        this.bindings = bindings;
        this.payouts = payouts;
        this.payoutService = payoutService;
        this.users = users;
        this.props = props;
        this.clock = clock;
    }




    @Transactional(readOnly = true)
    public AffiliateDashboard dashboard(UUID userId) {
        Affiliate a = loadActive(userId);
        Map<CommissionStatus, CommissionStatusSummary> summary = new EnumMap<>(CommissionStatus.class);
        for (CommissionStatus s : CommissionStatus.values()) {
            summary.put(s, new CommissionStatusSummary(0, 0));
        }
        for (Object[] row : commissions.summarize(a.getId())) {
            summary.put(CommissionStatus.valueOf((String) row[0]),
                    new CommissionStatusSummary(((Number) row[1]).longValue(), ((Number) row[2]).longValue()));
        }
        Instant now = clock.instant();
        String base = props.shareBaseUrl() == null ? "" : props.shareBaseUrl().replaceAll("/+$", "");
        return new AffiliateDashboard(a.getReferralCode(), base + "/?ref=" + a.getReferralCode(), a.getStatus().name(),
                clicks.countByAffiliateId(a.getId()),
                clicks.countByAffiliateIdAndClickedAtAfter(a.getId(), now.minus(Duration.ofDays(30))),
                bindings.countByAffiliateId(a.getId()), summary,
                payoutService.availableBalance(a.getId()).amount(), payouts.sumPaid(a.getId()), props.minPayout(),
                a.withdrawLockedUntil(props.bankChangeLock()), a.getBankAccount() != null);
    }

    @Transactional(readOnly = true)
    public <T> Page<T> commissions(UUID userId, int page, int size, Function<Commission, T> mapper) {
        Affiliate a = loadActive(userId);
        return commissions.findByAffiliateId(a.getId(), PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.desc("createdAt")))).map(mapper);
    }

    /** Khách đã gắn với CTV – chỉ hiện SĐT / email đã che (không lộ thông tin khách). */
    @Transactional(readOnly = true)
    public Page<BoundCustomer> customers(UUID userId, int page, int size) {
        Affiliate a = loadActive(userId);
        Page<CustomerBinding> result = bindings.findByAffiliateId(a.getId(), PageRequest.of(Math.max(page, 0),
                Math.clamp(size, 1, 50), Sort.by(Sort.Order.desc("boundAt"))));
        return result.map(b -> new BoundCustomer(
                users.findContact(b.getCustomerId()).map(UserContact::masked).orElse("–"), b.getBoundAt()));
    }

    private Affiliate loadActive(UUID userId) {
        Affiliate a = affiliates.findByUserId(userId)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.AFFILIATE_NOT_REGISTERED));
        if (a.getReferralCode() == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.AFFILIATE_NOT_APPROVED);
        }
        return a;
    }
}
