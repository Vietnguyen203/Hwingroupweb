package com.vietnl.hwin.common.domain;

import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.math.BigDecimal;
import java.math.RoundingMode;


/**
 * Value object tiền VND (số nguyên đồng, không âm, bất biến).
 * Lưu DB dạng bigint qua {@link MoneyConverter}.
 */
public record Money(long amount) implements Comparable<Money> {

    public static final Money ZERO = new Money(0);

    public Money {
        if (amount < 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.MONEY_NEGATIVE);
        }
    }

    public static Money of(long amount) {
        return new Money(amount);
    }

    public Money plus(Money other) {
        return new Money(Math.addExact(amount, other.amount));
    }

    /** Trừ tiền; kết quả âm sẽ ném ResponseException. */
    public Money minus(Money other) {
        return new Money(amount - other.amount);
    }

    public Money times(int quantity) {
        if (quantity < 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.QUANTITY_NEGATIVE);
        }
        return new Money(Math.multiplyExact(amount, quantity));
    }

    /** Nhân với tỉ lệ (ví dụ hoa hồng 0.10), làm tròn xuống đồng. */
    public Money multiply(BigDecimal rate) {
        return new Money(BigDecimal.valueOf(amount).multiply(rate).setScale(0, RoundingMode.FLOOR).longValueExact());
    }

    public boolean isGreaterThan(Money other) {
        return amount > other.amount;
    }

    public boolean isLessThan(Money other) {
        return amount < other.amount;
    }

    public boolean isZero() {
        return amount == 0;
    }

    @Override
    public int compareTo(Money o) {
        return Long.compare(amount, o.amount);
    }

    @Override
    public String toString() {
        return amount + " VND";
    }
}
