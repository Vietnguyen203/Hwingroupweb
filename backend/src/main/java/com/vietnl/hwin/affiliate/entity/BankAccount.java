package com.vietnl.hwin.affiliate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Value object: tài khoản ngân hàng nhận hoa hồng. Số tài khoản và chủ tài khoản được lưu ĐÃ MÃ HÓA
 * (AES-GCM, xem BankAccountCrypto); chỉ 4 số cuối để hiển thị.
 */
@Embeddable
public record BankAccount(
        @Column(name = "bank_name") String bankName,
        @Column(name = "bank_account_no_enc") String accountNoEncrypted,
        @Column(name = "bank_account_holder_enc") String holderEncrypted,
        @Column(name = "bank_account_no_last4") String accountNoLast4) {

    public String maskedAccountNo() {
        return accountNoLast4 == null ? null : "****" + accountNoLast4;
    }
}
