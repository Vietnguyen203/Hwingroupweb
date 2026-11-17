package com.vietnl.hwin.affiliate.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.vietnl.hwin.affiliate.entity.AffiliateEnums.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.AffiliateEnums.PayoutStatus;
import com.vietnl.hwin.affiliate.service.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.BankAccountCrypto;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.ResponseException;

/** Unit test quy tắc nghiệp vụ của module affiliate (không cần Spring/DB). */
class AffiliateDomainTest {

    private static final Instant T0 = Instant.parse("2026-01-01T00:00:00Z");
    private static final UUID ADMIN = UUID.randomUUID();
    private static final BigDecimal RATE = new BigDecimal("0.10");
    private static final Duration LOCK = Duration.ofHours(48);
    private static final BankAccount BANK = new BankAccount("Vietcombank", "enc-no", "enc-holder", "6789");

    private static Affiliate approved() {
        Affiliate a = Affiliate.register(UUID.randomUUID(), PhoneNumber.of("0901234567"), "CTV A", null, null);
        a.approve(new ReferralCode("ABC12345"), ADMIN, T0);
        return a;
    }

    // ------------------------------------------------------------------ hoa hồng

    @Test
    void commissionIsTenPercentOfSubtotalMinusDiscountRoundedDown() {
        Commission c = Commission.create(UUID.randomUUID(), "HW1", UUID.randomUUID(), UUID.randomUUID(),
                Money.of(123_456), Money.of(3_456), RATE);
        assertThat(c.getBaseAmount()).isEqualTo(Money.of(120_000));
        assertThat(c.getAmount()).isEqualTo(Money.of(12_000));

        Commission odd = Commission.create(UUID.randomUUID(), "HW2", UUID.randomUUID(), UUID.randomUUID(),
                Money.of(95_009), Money.ZERO, RATE);
        assertThat(odd.getAmount()).isEqualTo(Money.of(9_500)); // floor, không làm tròn lên
    }

    @Test
    void commissionApprovedOnlyAfterDeliveryPlusHoldDays() {
        Commission c = Commission.create(UUID.randomUUID(), "HW1", UUID.randomUUID(), UUID.randomUUID(),
                Money.of(100_000), Money.ZERO, RATE);
        assertThatThrownBy(() -> c.approve(T0)).hasFieldOrPropertyWithValue("code", "COMMISSION_NOT_ELIGIBLE");
        c.markEligible(T0.plus(Duration.ofDays(7)));
        assertThatThrownBy(() -> c.approve(T0.plus(Duration.ofDays(6)))).hasFieldOrPropertyWithValue("code", "COMMISSION_NOT_ELIGIBLE");
        assertThat(c.isDue(T0.plus(Duration.ofDays(7)))).isTrue();
        c.approve(T0.plus(Duration.ofDays(7)));
        assertThat(c.getStatus()).isEqualTo(CommissionStatus.APPROVED);
    }

    @Test
    void cancelledCommissionStaysCancelledAndApprovedCannotBeCancelled() {
        Commission c = Commission.create(UUID.randomUUID(), "HW1", UUID.randomUUID(), UUID.randomUUID(),
                Money.of(100_000), Money.ZERO, RATE);
        assertThat(c.cancel(T0)).isTrue();
        assertThat(c.cancel(T0)).isFalse(); // idempotent khi event phát lại
        c.markEligible(T0); // bỏ qua khi đã hủy
        assertThat(c.getEligibleAt()).isNull();

        Commission approved = Commission.create(UUID.randomUUID(), "HW3", UUID.randomUUID(), UUID.randomUUID(),
                Money.of(100_000), Money.ZERO, RATE);
        approved.markEligible(T0);
        approved.approve(T0);
        assertThatThrownBy(() -> approved.cancel(T0)).isInstanceOf(ResponseException.class);
    }

    // ------------------------------------------------------------------ rút tiền

    @Test
    void payoutRequiresMinimumAndAvailableBalance() {
        Money min = Money.of(200_000);
        assertThatThrownBy(() -> Payout.request(UUID.randomUUID(), Money.of(199_999), Money.of(1_000_000), min, BANK, T0))
                .hasFieldOrPropertyWithValue("code", "PAYOUT_BELOW_MINIMUM");
        assertThatThrownBy(() -> Payout.request(UUID.randomUUID(), Money.of(300_000), Money.of(250_000), min, BANK, T0))
                .hasFieldOrPropertyWithValue("code", "INSUFFICIENT_BALANCE");
        Payout p = Payout.request(UUID.randomUUID(), Money.of(200_000), Money.of(250_000), min, BANK, T0);
        assertThat(p.getStatus()).isEqualTo(PayoutStatus.REQUESTED);
        assertThat(p.getBankAccountNoEncrypted()).isEqualTo("enc-no");
    }

    @Test
    void payoutLifecycle() {
        Payout p = Payout.request(UUID.randomUUID(), Money.of(200_000), Money.of(200_000), Money.of(200_000), BANK, T0);
        assertThatThrownBy(() -> p.markPaid("FT1", ADMIN, T0)).hasFieldOrPropertyWithValue("code", "INVALID_STATE_TRANSITION");
        p.approve(ADMIN, T0);
        assertThatThrownBy(() -> p.markPaid(" ", ADMIN, T0)).hasFieldOrPropertyWithValue("code", "TRANSACTION_REF_REQUIRED");
        p.markPaid("FT123", ADMIN, T0);
        assertThat(p.getStatus()).isEqualTo(PayoutStatus.PAID);
        assertThatThrownBy(() -> p.reject("x", ADMIN, T0)).isInstanceOf(ResponseException.class);
    }

    @Test
    void rejectedPayoutNeedsReason() {
        Payout p = Payout.request(UUID.randomUUID(), Money.of(200_000), Money.of(200_000), Money.of(200_000), BANK, T0);
        assertThatThrownBy(() -> p.reject("", ADMIN, T0)).hasFieldOrPropertyWithValue("code", "REASON_REQUIRED");
        p.reject("Sai thông tin", ADMIN, T0);
        assertThat(p.getStatus()).isEqualTo(PayoutStatus.REJECTED);
    }

    // ------------------------------------------------------------------ CTV

    @Test
    void affiliateStatusTransitions() {
        Affiliate a = Affiliate.register(UUID.randomUUID(), PhoneNumber.of("0901234567"), "CTV", null, null);
        assertThat(a.canEarn()).isFalse();
        a.reject("Thiếu thông tin", ADMIN, T0);
        assertThatThrownBy(() -> a.approve(new ReferralCode("ABC12345"), ADMIN, T0)).isInstanceOf(ResponseException.class);
        a.reapply("CTV", "https://fb.com/ctv", null);
        a.approve(new ReferralCode("ABC12345"), ADMIN, T0);
        assertThat(a.canEarn()).isTrue();
        a.suspend("Vi phạm", ADMIN, T0);
        assertThat(a.canEarn()).isFalse();
        a.reinstate(ADMIN, T0);
        assertThat(a.getStatus()).isEqualTo(AffiliateStatus.APPROVED);
        assertThat(a.getReferralCode()).isEqualTo("ABC12345");
    }

    @Test
    void firstBankSetupDoesNotLockButChangeLocks48h() {
        Affiliate a = approved();
        assertThatThrownBy(() -> a.assertCanWithdraw(T0, LOCK)).hasFieldOrPropertyWithValue("code", "BANK_ACCOUNT_REQUIRED");
        a.changeBankAccount(BANK, T0);
        a.assertCanWithdraw(T0, LOCK); // lần đầu: không khóa
        a.changeBankAccount(BANK, T0);
        assertThatThrownBy(() -> a.assertCanWithdraw(T0.plus(Duration.ofHours(47)), LOCK))
                .hasFieldOrPropertyWithValue("code", "WITHDRAW_LOCKED");
        a.assertCanWithdraw(T0.plus(Duration.ofHours(48)), LOCK);
    }

    @Test
    void suspendedAffiliateCannotWithdraw() {
        Affiliate a = approved();
        a.changeBankAccount(BANK, T0);
        a.suspend("Kiểm tra", ADMIN, T0);
        assertThatThrownBy(() -> a.assertCanWithdraw(T0, LOCK)).hasFieldOrPropertyWithValue("code", "AFFILIATE_NOT_ACTIVE");
    }

    @Test
    void selfReferralDetectedByAccountOrPhone() {
        Affiliate a = approved();
        assertThat(a.isSelf(a.getUserId(), null)).isTrue();
        assertThat(a.isSelf(UUID.randomUUID(), PhoneNumber.of("0901234567"))).isTrue();
        assertThat(a.isSelf(UUID.randomUUID(), PhoneNumber.of("0911111111"))).isFalse();
    }

    @Test
    void referralCodeFormat() {
        assertThat(ReferralCode.parseOrNull(" abc12345 ")).isEqualTo(new ReferralCode("ABC12345"));
        assertThat(ReferralCode.parseOrNull("ab")).isNull();
        assertThat(ReferralCode.parseOrNull("abc-123")).isNull();
        assertThat(ReferralCode.generate().value()).matches("[A-Z0-9]{8}");
    }

    @Test
    void bankAccountEncryptedWithAesGcm() {
        var crypto = new BankAccountCrypto(new AffiliateProperties(RATE, 7, 200_000, 30, 24, 48,
                "dGVzdC1vbmx5LWFlcy1nY20ta2V5LTMyLWJ5dGVzISE=", null, false));
        BankAccount enc = crypto.encrypt("VCB", "0123 456 789", "Nguyen Van A");
        assertThat(enc.accountNoEncrypted()).doesNotContain("0123456789");
        assertThat(enc.accountNoLast4()).isEqualTo("6789");
        assertThat(crypto.decrypt(enc.accountNoEncrypted())).isEqualTo("0123456789");
        assertThat(crypto.decrypt(enc.holderEncrypted())).isEqualTo("NGUYEN VAN A");
        // cùng dữ liệu nhưng IV ngẫu nhiên -> bản mã khác nhau
        assertThat(crypto.encrypt("x")).isNotEqualTo(crypto.encrypt("x"));
    }
}
