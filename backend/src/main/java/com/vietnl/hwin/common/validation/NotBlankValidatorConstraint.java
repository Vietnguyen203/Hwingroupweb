package com.vietnl.hwin.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Cài đặt của {@link NotBlankValidator}. */
public class NotBlankValidatorConstraint implements ConstraintValidator<NotBlankValidator, CharSequence> {
    private NotBlankValidator a;

    @Override
    public void initialize(NotBlankValidator a) {
        this.a = a;
    }

    @Override
    public boolean isValid(CharSequence v, ConstraintValidatorContext ctx) {
        return v != null && !v.toString().trim().isEmpty() || ValidationMessages.fail(ctx, a.message(), ValidationMessages.label(a.field()) + " là bắt buộc");
    }
}
