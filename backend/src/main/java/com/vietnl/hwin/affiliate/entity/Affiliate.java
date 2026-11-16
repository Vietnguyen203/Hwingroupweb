package com.vietnl.hwin.affiliate.entity;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.affiliate.entity.AffiliateEnums.AffiliateStatus;
import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: cộng tác viên.
 * <pre>PENDING -> APPROVED / REJECTED;  APPROVED <-> SUSPENDED;  REJECTED -> PENDING (đăng ký lại)</pre>
 * Chỉ APPROVED mới có link hoạt động, nhận hoa hồng mới và được rút tiền.
 */
@Entity
@Table(name = "affiliate", schema = "affiliate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Affiliate extends AggregateRoot<Affiliate> {

    public static final String INVALID_STATE = "INVALID_STATE_TRANSITION";

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    private PhoneNumber phone;

    @Column(nullable = false)
    private String fullName;

    private String referralCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AffiliateStatus status;

    private String socialLink;

    private String note;

    @Embedded
    private BankAccount bankAccount;

    private Instant bankChangedAt;

    private UUID reviewedBy;

    private Instant reviewedAt;

    private String statusReason;

    public static Affiliate register(UUID userId, PhoneNumber phone, String fullName, String socialLink, String note) {
        Affiliate a = new Affiliate();
        a.userId = userId;
        a.phone = phone;
        a.status = AffiliateStatus.PENDING;
        a.updateProfile(fullName, socialLink, note);
        return a;
    }

    /** Đăng ký lại sau khi bị từ chối. */
    public void reapply(String fullName, String socialLink, String note) {
        requireStatus(Set.of(AffiliateStatus.REJECTED), "đăng ký lại");
        updateProfile(fullName, socialLink, note);
        this.status = AffiliateStatus.PENDING;
        this.statusReason = null;
    }

    /** Duyệt: gán mã giới thiệu (chỉ lần đầu) và phát AffiliateApproved. */
    public void approve(ReferralCode code, UUID adminId, Instant now) {
        requireStatus(Set.of(AffiliateStatus.PENDING), "duyệt");
        if (this.referralCode == null) {
            this.referralCode = code.value();
        }
        this.status = AffiliateStatus.APPROVED;
        this.statusReason = null;
        review(adminId, now);
        registerEvent(new AffiliateApproved(UUID.randomUUID(), now, id, userId, referralCode));
    }

    public void reject(String reason, UUID adminId, Instant now) {
        requireStatus(Set.of(AffiliateStatus.PENDING), "từ chối");
        this.status = AffiliateStatus.REJECTED;
        this.statusReason = requireReason(reason);
        review(adminId, now);
    }

    /** Tạm khóa: link ngừng hoạt động, không nhận hoa hồng mới, không rút tiền. */
    public void suspend(String reason, UUID adminId, Instant now) {
        requireStatus(Set.of(AffiliateStatus.APPROVED), "tạm khóa");
        this.status = AffiliateStatus.SUSPENDED;
        this.statusReason = requireReason(reason);
        review(adminId, now);
        registerEvent(new AffiliateSuspended(UUID.randomUUID(), now, id, userId));
    }

    public void reinstate(UUID adminId, Instant now) {
        requireStatus(Set.of(AffiliateStatus.SUSPENDED), "mở khóa");
        this.status = AffiliateStatus.APPROVED;
        this.statusReason = null;
        review(adminId, now);
        registerEvent(new AffiliateApproved(UUID.randomUUID(), now, id, userId, referralCode));
    }

    /**
     * Đổi tài khoản ngân hàng (đã xác thực OTP ở service). Lần thiết lập đầu tiên không khóa;
     * các lần đổi sau khóa rút tiền {@code lock} kể từ lúc đổi.
     */
    public void changeBankAccount(BankAccount account, Instant now) {
        requireStatus(Set.of(AffiliateStatus.APPROVED, AffiliateStatus.SUSPENDED), "cập nhật tài khoản ngân hàng");
        if (this.bankAccount != null) {
            this.bankChangedAt = now;
        }
        this.bankAccount = account;
    }

    /** Có được phép rút tiền lúc này không – ném lỗi mô tả lý do nếu không. */
    public void assertCanWithdraw(Instant now, Duration bankChangeLock) {
        if (status != AffiliateStatus.APPROVED) {
            throw new DomainException("AFFILIATE_NOT_ACTIVE", "Tài khoản CTV không ở trạng thái hoạt động");
        }
        if (bankAccount == null) {
            throw new DomainException("BANK_ACCOUNT_REQUIRED", "Vui lòng cập nhật tài khoản ngân hàng trước khi rút tiền");
        }
        Instant lockedUntil = withdrawLockedUntil(bankChangeLock);
        if (lockedUntil != null && now.isBefore(lockedUntil)) {
            throw new DomainException("WITHDRAW_LOCKED", "Vừa đổi tài khoản ngân hàng – được rút tiền sau " + lockedUntil)
                    .withDetail("lockedUntil", lockedUntil.toString());
        }
    }

    public Instant withdrawLockedUntil(Duration bankChangeLock) {
        return bankChangedAt == null ? null : bankChangedAt.plus(bankChangeLock);
    }

    /** Chỉ CTV đang hoạt động mới có link và hoa hồng mới. */
    public boolean canEarn() {
        return status == AffiliateStatus.APPROVED && referralCode != null;
    }

    /** Chống tự giới thiệu: khách là chính CTV (cùng tài khoản hoặc cùng SĐT). */
    public boolean isSelf(UUID customerUserId, PhoneNumber customerPhone) {
        return userId.equals(customerUserId) || (customerPhone != null && phone.equals(customerPhone));
    }

    private void updateProfile(String fullName, String socialLink, String note) {
        if (fullName == null || fullName.isBlank()) {
            throw new DomainException("NAME_REQUIRED", "Vui lòng nhập họ tên");
        }
        this.fullName = fullName.trim();
        this.socialLink = blankToNull(socialLink);
        this.note = blankToNull(note);
    }

    private void review(UUID adminId, Instant now) {
        this.reviewedBy = adminId;
        this.reviewedAt = now;
    }

    private void requireStatus(Set<AffiliateStatus> allowed, String action) {
        if (!allowed.contains(status)) {
            throw new DomainException(INVALID_STATE, "Không thể " + action + " khi CTV đang ở trạng thái " + status);
        }
    }

    private static String requireReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new DomainException("REASON_REQUIRED", "Vui lòng nhập lý do");
        }
        return reason.trim();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
