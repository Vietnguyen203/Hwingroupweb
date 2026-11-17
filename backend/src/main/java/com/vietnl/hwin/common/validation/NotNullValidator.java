package com.vietnl.hwin.common.validation;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/** Giá trị bắt buộc (không null). Thông báo tự sinh: "{field} là bắt buộc". */
@Documented
@Constraint(validatedBy = TextConstraints.NotNullCheck.class)
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
public @interface NotNullValidator {
    String field() default "";

    String message() default "";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
