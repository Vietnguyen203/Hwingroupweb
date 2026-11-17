package com.vietnl.hwin.common.validation;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/** Chuỗi bắt buộc (không null, không rỗng sau khi trim). Thông báo tự sinh: "{field} là bắt buộc". */
@Documented
@Constraint(validatedBy = NotBlankValidatorConstraint.class)
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
public @interface NotBlankValidator {
    /** Tên trường hiển thị trong thông báo lỗi (tiếng Việt). */
    String field() default "";

    /** Để trống -> dùng thông báo tự sinh. */
    String message() default "";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
