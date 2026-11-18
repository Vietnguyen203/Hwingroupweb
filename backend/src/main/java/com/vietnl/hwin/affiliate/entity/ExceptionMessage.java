package com.vietnl.hwin.affiliate.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module affiliate. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    AFFILIATE_NOT_ACTIVE("Affiliate account is not active"),
    BANK_ACCOUNT_REQUIRED("Please update bank account before requesting withdrawal"),
    WITHDRAW_LOCKED("Bank account recently changed - withdrawal locked until #lockedUntil#"),
    NAME_REQUIRED("Full name is required"),
    AFFILIATE_INVALID_STATE("Cannot #action# affiliate while in status #status#"),
    REASON_REQUIRED("Reason is required"),
    COMMISSION_RATE_INVALID("Invalid commission rate"),
    COMMISSION_NOT_PENDING("Only pending commissions can be approved"),
    COMMISSION_NOT_ELIGIBLE("Commission is not eligible for approval: #reason#"),
    COMMISSION_ALREADY_APPROVED("Commission already approved"),
    PAYOUT_BELOW_MINIMUM("Minimum withdrawal amount is #minPayout#"),
    INSUFFICIENT_BALANCE("Insufficient available balance"),
    TRANSACTION_REF_REQUIRED("Transaction reference number is required"),
    INVALID_STATE_TRANSITION("Cannot #action# payout in status #status#"),
    REFERRAL_CODE_INVALID("Invalid referral code"),
    AFFILIATE_NOT_FOUND("Affiliate not found"),
    AFFILIATE_NOT_REGISTERED("User is not registered as an affiliate"),
    AFFILIATE_NOT_APPROVED("Affiliate account is not approved yet"),
    PHONE_REQUIRED("Phone number is required for affiliate registration"),
    ID_CARD_REQUIRED("Please upload front and back photos of citizen ID"),
    ID_CARD_INVALID("Invalid citizen ID photo"),
    ID_CARD_NOT_FOUND("Citizen ID photos not found"),
    ID_CARD_UPLOAD_LIMIT("Upload limit exceeded, please try again in 1 hour"),
    ALREADY_REGISTERED("Already registered as affiliate (status #status#)"),
    PAYOUT_OPEN("You already have a pending withdrawal request"),
    PAYOUT_NOT_FOUND("Payout request not found");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
