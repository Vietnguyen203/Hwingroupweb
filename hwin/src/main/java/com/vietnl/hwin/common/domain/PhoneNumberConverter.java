package com.vietnl.hwin.common.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Map {@link PhoneNumber} &lt;-&gt; cột varchar (E.164). */
@Converter(autoApply = true)
public class PhoneNumberConverter implements AttributeConverter<PhoneNumber, String> {

    @Override
    public String convertToDatabaseColumn(PhoneNumber phone) {
        return phone == null ? null : phone.value();
    }

    @Override
    public PhoneNumber convertToEntityAttribute(String value) {
        return value == null ? null : new PhoneNumber(value);
    }
}
