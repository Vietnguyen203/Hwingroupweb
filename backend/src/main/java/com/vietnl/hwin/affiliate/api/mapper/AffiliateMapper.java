package com.vietnl.hwin.affiliate.api.mapper;

import java.time.Duration;

import org.mapstruct.Mapper;

import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminAffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminCommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AdminPayoutResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.AffiliateResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.CommissionResponse;
import com.vietnl.hwin.affiliate.api.dto.AffiliateDtos.PayoutResponse;
import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.BankAccount;
import com.vietnl.hwin.affiliate.entity.Commission;
import com.vietnl.hwin.affiliate.entity.Payout;
import com.vietnl.hwin.affiliate.service.PayoutService.PayoutWithBank;

/** Map entity affiliate -> DTO. Không bao giờ trả số tài khoản đầy đủ ra API của CTV. */
@Mapper
public interface AffiliateMapper {

    default AffiliateResponse toResponse(Affiliate a, Duration bankLock) {
        BankAccount b = a.getBankAccount();
        return new AffiliateResponse(a.getId(), a.getFullName(), a.getPhone().masked(), a.getStatus().name(),
                a.getReferralCode(), a.getSocialLink(), a.getNote(), a.getStatusReason(),
                b == null ? null : b.bankName(), b == null ? null : b.maskedAccountNo(),
                a.withdrawLockedUntil(bankLock), a.getCreatedAt(), a.getReviewedAt());
    }

    default AdminAffiliateResponse toAdmin(Affiliate a) {
        BankAccount b = a.getBankAccount();
        return new AdminAffiliateResponse(a.getId(), a.getUserId(), a.getFullName(), a.getPhone().local(),
                a.getStatus().name(), a.getReferralCode(), a.getSocialLink(), a.getNote(), a.getStatusReason(),
                b == null ? null : b.bankName(), b == null ? null : b.maskedAccountNo(), a.getCreatedAt(),
                a.getReviewedAt(), a.getReviewedBy());
    }

    default CommissionResponse toResponse(Commission c) {
        return new CommissionResponse(c.getId(), c.getOrderCode(), c.getBaseAmount().amount(), c.getRate(),
                c.getAmount().amount(), c.getStatus().name(), c.getCreatedAt(), c.getEligibleAt(), c.getApprovedAt(),
                c.getCancelledAt());
    }

    default AdminCommissionResponse toAdmin(Commission c) {
        return new AdminCommissionResponse(c.getId(), c.getAffiliateId(), c.getCustomerId(), c.getOrderCode(),
                c.getBaseAmount().amount(), c.getAmount().amount(), c.getStatus().name(), c.getCreatedAt(),
                c.getEligibleAt(), c.getApprovedAt());
    }

    default PayoutResponse toResponse(Payout p) {
        return new PayoutResponse(p.getId(), p.getAmount().amount(), p.getStatus().name(), p.getBankName(),
                p.getRequestedAt(), p.getApprovedAt(), p.getPaidAt(), p.getRejectedAt(), p.getTransactionRef(),
                p.getRejectReason());
    }

    default AdminPayoutResponse toAdmin(PayoutWithBank w) {
        Payout p = w.payout();
        return new AdminPayoutResponse(p.getId(), p.getAffiliateId(), p.getAmount().amount(), p.getStatus().name(),
                p.getBankName(), w.accountNo(), w.accountHolder(), p.getRequestedAt(), p.getApprovedAt(),
                p.getPaidAt(), p.getRejectedAt(), p.getTransactionRef(), p.getRejectReason(), p.getProcessedBy());
    }
}
