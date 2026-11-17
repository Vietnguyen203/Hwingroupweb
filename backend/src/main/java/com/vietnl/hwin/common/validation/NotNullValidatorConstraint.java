package com.vietnl.hwin.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Cài đặt của {@link NotNullValidator}. */
public class NotNullValidatorConstraint implements ConstraintValidator<NotNullValidator, Object> {
    private NotNullValidator a;

    @Override
    public void initialize(NotNullValidator a) {
        this.a = a;
    }

    @Override
    public boolean isValid(Object v, ConstraintValidatorContext ctx) {
        return v != null || ValidationMessages.fail(ctx, a.message(), ValidationMessages.label(a.field()) + " là bắt buộc");
    }
}
