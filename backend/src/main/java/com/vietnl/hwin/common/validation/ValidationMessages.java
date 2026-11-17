package com.vietnl.hwin.common.validation;

import jakarta.validation.ConstraintValidatorContext;

/** Tiện ích chung cho các validator tiếng Việt: tự sinh thông báo theo tên trường. */
final class ValidationMessages {

    private ValidationMessages() {
    }

    static boolean fail(ConstraintValidatorContext ctx, String custom, String auto) {
        ctx.disableDefaultConstraintViolation();
        ctx.buildConstraintViolationWithTemplate(escape(custom == null || custom.isBlank() ? auto : custom))
                .addConstraintViolation();
        return false;
    }

    /** Chặn Expression Language trong thông báo (tên trường do lập trình viên đặt, vẫn escape cho chắc). */
    static String escape(String s) {
        return s.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}").replace("$", "\\$");
    }

    static String label(String field) {
        return field == null || field.isBlank() ? "Trường này" : field;
    }
}
