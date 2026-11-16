package com.vietnl.hwin.affiliate.service;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.PayoutStatus;
import com.vietnl.hwin.affiliate.entity.Payout;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.affiliate.repository.PayoutRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.exception.NotFoundException;

/**
 * Số dư + rút tiền.
 * Số dư khả dụng = Σ hoa hồng APPROVED − Σ payout (REQUESTED, APPROVED, PAID) – được TÍNH, không lưu,
 * nên payout bị từ chối tự trả tiền về số dư và mỗi transaction chỉ sửa một aggregate.
 */
@Service
public class PayoutService {

    private final PayoutRepository payouts;
    private final CommissionRepository commissions;
    private final AffiliateRepository affiliates;
    private final BankAccountCrypto crypto;
    private final AffiliateProperties props;
    private final AuditLogger audit;
    private final Clock clock;

    public PayoutService(PayoutRepository payouts, CommissionRepository commissions, AffiliateRepository affiliates,
                         BankAccountCrypto crypto, AffiliateProperties props, AuditLogger audit, Clock clock) {
        this.payouts = payouts;
        this.commissions = commissions;
        this.affiliates = affiliates;
        this.crypto = crypto;
        this.props = props;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Money availableBalance(UUID affiliateId) {
        long approved = commissions.sumApproved(affiliateId);
        long used = payouts.sumNotRejected(affiliateId);
        return Money.of(Math.max(0, approved - used));
    }

    // ------------------------------------------------------------------ CTV

    @Transactional
    public <T> T request(UUID userId, long amount, Function<Payout, T> mapper) {
        Affiliate a = affiliates.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Bạn chưa đăng ký cộng tác viên"));
        Instant now = clock.instant();
        a.assertCanWithdraw(now, props.bankChangeLock());
        if (payouts.existsByAffiliateIdAndStatusIn(a.getId(), EnumSet.of(PayoutStatus.REQUESTED, PayoutStatus.APPROVED))) {
            throw new DomainException("PAYOUT_OPEN", "Bạn đang có một yêu cầu rút tiền chưa xử lý xong");
        }
        Payout p = payouts.saveAndFlush(Payout.request(a.getId(), Money.of(amount), availableBalance(a.getId()),
                props.minPayoutMoney(), a.getBankAccount(), now));
        audit.log("affiliate", "Payout", p.getId(), "PAYOUT_REQUESTED", userId, amount, null);
        return mapper.apply(p);
    }

    @Transactional(readOnly = true)
    public <T> Page<T> listMine(UUID userId, int page, int size, Function<Payout, T> mapper) {
        Affiliate a = affiliates.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Bạn chưa đăng ký cộng tác viên"));
        return payouts.findByAffiliateId(a.getId(), PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
                Sort.by(Sort.Order.desc("requestedAt")))).map(mapper);
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public <T> Page<T> search(PayoutStatus status, int page, int size, Function<Payout, T> mapper) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
                Sort.by(Sort.Order.asc("requestedAt")));
        return (status == null ? payouts.findAll(pageable) : payouts.findByStatus(status, pageable)).map(mapper);
    }

    /** Chi tiết cho admin kèm thông tin ngân hàng ĐÃ GIẢI MÃ – mỗi lần xem đều ghi audit. */
    @Transactional
    public PayoutWithBank getForAdmin(UUID id, UUID adminId) {
        Payout p = load(id);
        audit.log("affiliate", "Payout", id, "BANK_VIEWED", adminId, null, null);
        return new PayoutWithBank(p, crypto.decrypt(p.getBankAccountNoEncrypted()),
                crypto.decrypt(p.getBankAccountHolderEncrypted()));
    }

    @Transactional
    public <T> T approve(UUID id, UUID adminId, Function<Payout, T> mapper) {
        Payout p = load(id);
        p.approve(adminId, clock.instant());
        audit.log("affiliate", "Payout", id, "PAYOUT_APPROVED", adminId, p.getAmount().amount(), null);
        return mapper.apply(payouts.save(p));
    }

    @Transactional
    public <T> T markPaid(UUID id, String transactionRef, UUID adminId, Function<Payout, T> mapper) {
        Payout p = load(id);
        p.markPaid(transactionRef, adminId, clock.instant());
        audit.log("affiliate", "Payout", id, "PAYOUT_PAID", adminId, p.getAmount().amount(),
                "{\"transactionRef\":\"" + p.getTransactionRef().replace("\"", "") + "\"}");
        return mapper.apply(payouts.save(p));
    }

    @Transactional
    public <T> T reject(UUID id, String reason, UUID adminId, Function<Payout, T> mapper) {
        Payout p = load(id);
        p.reject(reason, adminId, clock.instant());
        audit.log("affiliate", "Payout", id, "PAYOUT_REJECTED", adminId, p.getAmount().amount(), null);
        return mapper.apply(payouts.save(p));
    }

    private Payout load(UUID id) {
        return payouts.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu rút tiền"));
    }

    public record PayoutWithBank(Payout payout, String accountNo, String accountHolder) {
    }
}
