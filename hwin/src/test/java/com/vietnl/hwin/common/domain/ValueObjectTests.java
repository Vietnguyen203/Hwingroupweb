package com.vietnl.hwin.common.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.vietnl.hwin.common.exception.DomainException;

class ValueObjectTests {

    @Test
    void phoneNumberNormalizesVietnameseFormats() {
        assertThat(PhoneNumber.of("0912345678").value()).isEqualTo("+84912345678");
        assertThat(PhoneNumber.of("+84 912 345 678").value()).isEqualTo("+84912345678");
        assertThat(PhoneNumber.of("84912345678").value()).isEqualTo("+84912345678");
        assertThat(PhoneNumber.of("0912.345.678")).isEqualTo(PhoneNumber.of("0912345678"));
    }

    @Test
    void phoneNumberMasksForLogs() {
        assertThat(PhoneNumber.of("0912345689").masked()).isEqualTo("09******89");
    }

    @Test
    void phoneNumberRejectsInvalid() {
        assertThatThrownBy(() -> PhoneNumber.of("012345")).isInstanceOf(DomainException.class);
        assertThatThrownBy(() -> PhoneNumber.of("0212345678")).isInstanceOf(DomainException.class);
    }

    @Test
    void moneyIsNeverNegative() {
        assertThatThrownBy(() -> Money.of(-1)).isInstanceOf(DomainException.class);
        assertThatThrownBy(() -> Money.of(100).minus(Money.of(200))).isInstanceOf(DomainException.class);
    }

    @Test
    void moneyArithmetic() {
        assertThat(Money.of(95000).times(2).plus(Money.of(30000))).isEqualTo(Money.of(220000));
        // Hoa hồng 10% làm tròn xuống
        assertThat(Money.of(123455).multiply(new BigDecimal("0.10"))).isEqualTo(Money.of(12345));
    }
}
