package com.vietnl.hwin.affiliate.entity;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.affiliate.entity.AffiliateEnums.PayoutStatus;
import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.exception.DomainException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: yêu cầu rút tiền.
 * <pre>REQUESTED -> APPROVED -> PAID ;  REQUESTED | APPROVED -> REJECTED</pre>
 * Số dư khả dụng được TÍNH (hoa hồng APPROVED - payout chưa bị từ chối) nên khi REJECTED
 * tiền tự trở lại số dư mà không phải sửa hoa hồng.
 */
@Entity
@Table(name = "payout", schema = "affiliate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payout extends AggregateRoot<Payout> {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID affiliateId;

    @Column(nullable = false)
    private Money amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status;

    @Column(nullable = false)
    private String bankName;

    @Column(name = "bank_account_no_enc", nullable = false)
    private String bankAccountNoEncrypted;

    @Column(name = "bank_account_holder_enc", nullable = false)
    private String bankAccountHolderEncrypted;

    private String transactionRef;

    private String rejectReason;

    private UUID processedBy;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant approvedAt;

    private Instant paidAt;

    private Instant rejectedAt;

    /**
     * @param available  số dư khả dụng hiện tại
     * @param minPayout  mức rút tối thiểu
     * @param bank       tài khoản nhận tiền (chụp lại tại thời điểm yêu cầu)
     */
    public static Payout request(UUID affiliateId, Money amount, Money available, Money minPayout, BankAccount bank,
                                 Instant now) {
        if (amount.isLessThan(minPayout)) {
            throw new DomainException("PAYOUT_BELOW_MINIMUM", "Số tiền rút tối thiểu là " + minPayout.amount() + "đ")
                    .withDetail("minPayout", minPayout.amount());
        }
        if (amount.isGreaterThan(available)) {
            throw new DomainException("INSUFFICIENT_BALANCE", "Số dư khả dụng không đủ")
                    .withDetail("available", available.amount());
        }
        Payout p = new Payout();
        p.affiliateId = affiliateId;
        p.amount = amount;
        p.status = PayoutStatus.REQUESTED;
        p.bankName = bank.bankName();
        p.bankAccountNoEncrypted = bank.accountNoEncrypted();
        p.bankAccountHolderEncrypted = bank.holderEncrypted();
        p.requestedAt = now;
        return p;
    }

    public void approve(UUID adminId, Instant now) {
        requireStatus(Set.of(PayoutStatus.REQUESTED), "duyệt");
        this.status = PayoutStatus.APPROVED;
        this.approvedAt = now;
        this.processedBy = adminId;
    }

    /** Đã chuyển khoản: bắt buộc nhập mã giao dịch để đối soát. */
    public void markPaid(String transactionRef, UUID adminId, Instant now) {
        requireStatus(Set.of(PayoutStatus.APPROVED), "đánh dấu đã chi trả");
        if (transactionRef == null || transactionRef.isBlank()) {
            throw new DomainException("TRANSACTION_REF_REQUIRED", "Vui lòng nhập mã giao dịch chuyển khoản");
        }
        this.status = PayoutStatus.PAID;
        this.transactionRef = transactionRef.trim();
        this.paidAt = now;
        this.processedBy = adminId;
    }

    public void reject(String reason, UUID adminId, Instant now) {
        requireStatus(Set.of(PayoutStatus.REQUESTED, PayoutStatus.APPROVED), "từ chối");
        if (reason == null || reason.isBlank()) {
            throw new DomainException("REASON_REQUIRED", "Vui lòng nhập lý do từ chối");
        }
        this.status = PayoutStatus.REJECTED;
        this.rejectReason = reason.trim();
        this.rejectedAt = now;
        this.processedBy = adminId;
    }

    private void requireStatus(Set<PayoutStatus> allowed, String action) {
        if (!allowed.contains(status)) {
            throw new DomainException("INVALID_STATE_TRANSITION",
                    "Không thể " + action + " yêu cầu rút tiền đang ở trạng thái " + status);
        }
    }
}
