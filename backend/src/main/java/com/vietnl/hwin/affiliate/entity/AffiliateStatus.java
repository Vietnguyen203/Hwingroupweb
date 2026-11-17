package com.vietnl.hwin.affiliate.entity;



/** PENDING -> APPROVED / REJECTED; APPROVED <-> SUSPENDED; REJECTED -> PENDING (đăng ký lại). */
public enum AffiliateStatus {
    PENDING,
    APPROVED,
    REJECTED,
    SUSPENDED
}
