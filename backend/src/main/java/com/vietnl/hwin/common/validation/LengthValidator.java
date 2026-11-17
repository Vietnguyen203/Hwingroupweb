package com.vietnl.hwin.common.validation;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Độ dài chuỗi trong [min, max]. CHO PHÉP null – kết hợp {@link NotBlankValidator} nếu bắt buộc.
 * Thông báo tự sinh: "{field} phải có độ dài từ {min} đến {max} ký tự".
 */
@Documented
@Constraint(validatedBy = LengthValidatorConstraint.class)
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
public @interface LengthValidator {
    int min() default 0;

    int max() default 255;

    String field() default "";

    String message() default "";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
