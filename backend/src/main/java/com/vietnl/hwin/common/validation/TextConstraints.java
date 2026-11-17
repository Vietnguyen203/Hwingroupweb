package com.vietnl.hwin.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Cài đặt các validator tiếng Việt: tự sinh thông báo theo tên trường khi không truyền {@code message}. */
public final class TextConstraints {

    private TextConstraints() {
    }

    private static boolean fail(ConstraintValidatorContext ctx, String custom, String auto) {
        ctx.disableDefaultConstraintViolation();
        ctx.buildConstraintViolationWithTemplate(escape(custom == null || custom.isBlank() ? auto : custom))
                .addConstraintViolation();
        return false;
    }

    /** Chặn Expression Language trong thông báo (tên trường do lập trình viên đặt, vẫn escape cho chắc). */
    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}").replace("$", "\\$");
    }

    private static String label(String field) {
        return field == null || field.isBlank() ? "Trường này" : field;
    }

    public static class NotBlankCheck implements ConstraintValidator<NotBlankValidator, CharSequence> {
        private NotBlankValidator a;

        @Override
        public void initialize(NotBlankValidator a) {
            this.a = a;
        }

        @Override
        public boolean isValid(CharSequence v, ConstraintValidatorContext ctx) {
            return v != null && !v.toString().trim().isEmpty() || fail(ctx, a.message(), label(a.field()) + " là bắt buộc");
        }
    }

    public static class NotNullCheck implements ConstraintValidator<NotNullValidator, Object> {
        private NotNullValidator a;

        @Override
        public void initialize(NotNullValidator a) {
            this.a = a;
        }

        @Override
        public boolean isValid(Object v, ConstraintValidatorContext ctx) {
            return v != null || fail(ctx, a.message(), label(a.field()) + " là bắt buộc");
        }
    }

    public static class LengthCheck implements ConstraintValidator<LengthValidator, CharSequence> {
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
            return len >= a.min() && len <= a.max() || fail(ctx, a.message(),
                    label(a.field()) + " phải có độ dài từ " + a.min() + " đến " + a.max() + " ký tự");
        }
    }
}
