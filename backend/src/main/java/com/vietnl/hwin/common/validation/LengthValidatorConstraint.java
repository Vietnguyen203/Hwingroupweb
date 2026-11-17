package com.vietnl.hwin.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Cài đặt của {@link LengthValidator}. */
public class LengthValidatorConstraint implements ConstraintValidator<LengthValidator, CharSequence> {
    private LengthValidator a;

    @Override
    public void initialize(LengthValidator a) {
        this.a = a;
    }

    @Override
    public boolean isValid(CharSequence v, ConstraintValidatorContext ctx) {
        if (v == null) {
            return true;
        }
        int len = v.length();
        return len >= a.min() && len <= a.max() || ValidationMessages.fail(ctx, a.message(),
                ValidationMessages.label(a.field()) + " phải có độ dài từ " + a.min() + " đến " + a.max() + " ký tự");
    }
}
