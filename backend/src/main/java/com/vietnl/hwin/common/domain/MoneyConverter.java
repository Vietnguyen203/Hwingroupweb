package com.vietnl.hwin.common.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Map {@link Money} &lt;-&gt; cột bigint. */
@Converter(autoApply = true)
public class MoneyConverter implements AttributeConverter<Money, Long> {

    @Override
    public Long convertToDatabaseColumn(Money money) {
        return money == null ? null : money.amount();
    }

    @Override
    public Money convertToEntityAttribute(Long value) {
        return value == null ? null : Money.of(value);
    }
}
