package com.vietnl.hwin.affiliate.entity;

import com.vietnl.hwin.common.exception.BaseErrorMessage;

/**
 * Mã lỗi + câu thông báo của module affiliate. Placeholder #key# được thay bằng dữ liệu truyền vào ResponseException.
 */
public enum ExceptionMessage implements BaseErrorMessage {
    AFFILIATE_NOT_ACTIVE("Tài khoản CTV không ở trạng thái hoạt động"),
    BANK_ACCOUNT_REQUIRED("Vui lòng cập nhật tài khoản ngân hàng trước khi rút tiền"),
    WITHDRAW_LOCKED("Vừa đổi tài khoản ngân hàng – được rút tiền sau #lockedUntil#"),
    NAME_REQUIRED("Vui lòng nhập họ tên"),
    AFFILIATE_INVALID_STATE("Không thể #action# khi CTV đang ở trạng thái #status#"),
    REASON_REQUIRED("Vui lòng nhập lý do"),
    COMMISSION_RATE_INVALID("Tỉ lệ hoa hồng không hợp lệ"),
    COMMISSION_NOT_PENDING("Chỉ duyệt được hoa hồng đang chờ"),
    COMMISSION_NOT_ELIGIBLE("Hoa hồng chưa đủ điều kiện duyệt: #reason#"),
    COMMISSION_ALREADY_APPROVED("Hoa hồng đã duyệt, không thể hủy"),
    PAYOUT_BELOW_MINIMUM("Số tiền rút tối thiểu là #minPayout#đ"),
    INSUFFICIENT_BALANCE("Số dư khả dụng không đủ"),
    TRANSACTION_REF_REQUIRED("Vui lòng nhập mã giao dịch chuyển khoản"),
    INVALID_STATE_TRANSITION("Không thể #action# yêu cầu rút tiền đang ở trạng thái #status#"),
    REFERRAL_CODE_INVALID("Mã giới thiệu không hợp lệ"),
    AFFILIATE_NOT_FOUND("Không tìm thấy CTV"),
    AFFILIATE_NOT_REGISTERED("Bạn chưa đăng ký cộng tác viên"),
    AFFILIATE_NOT_APPROVED("Tài khoản CTV chưa được duyệt"),
    PHONE_REQUIRED("Vui lòng nhập số điện thoại liên hệ để đăng ký CTV"),
    ALREADY_REGISTERED("Bạn đã đăng ký CTV (trạng thái #status#)"),
    PAYOUT_OPEN("Bạn đang có một yêu cầu rút tiền chưa xử lý xong"),
    PAYOUT_NOT_FOUND("Không tìm thấy yêu cầu rút tiền");

    private final String val;

    ExceptionMessage(String val) {
        this.val = val;
    }

    @Override
    public String val() {
        return val;
    }
}
