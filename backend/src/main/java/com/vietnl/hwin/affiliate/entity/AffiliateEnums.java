package com.vietnl.hwin.affiliate.entity;

/** Các enum trạng thái của module affiliate. */
public final class AffiliateEnums {

    private AffiliateEnums() {
    }

    /** PENDING -> APPROVED / REJECTED; APPROVED <-> SUSPENDED; REJECTED -> PENDING (đăng ký lại). */
    public enum AffiliateStatus {
        PENDING,
        APPROVED,
        REJECTED,
        SUSPENDED
    }

    /** PENDING -> APPROVED (sau giao + hold-days) / CANCELLED (đơn hủy hoặc trả hàng). */
    public enum CommissionStatus {
        PENDING,
        APPROVED,
        CANCELLED
    }

    /** REQUESTED -> APPROVED -> PAID; REQUESTED/APPROVED -> REJECTED. */
    public enum PayoutStatus {
        REQUESTED,
        APPROVED,
        PAID,
        REJECTED
    }
}
