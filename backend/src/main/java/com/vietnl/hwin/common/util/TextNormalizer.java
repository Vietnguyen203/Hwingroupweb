package com.vietnl.hwin.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Xử lý chuỗi tiếng Việt: bỏ dấu, tạo slug. */
public final class TextNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_SLUG = Pattern.compile("[^a-z0-9]+");

    private TextNormalizer() {
    }

    /** "Chả lụa Đặc biệt" -> "Cha lua Dac biet". */
    public static String unaccent(String input) {
        if (input == null) {
            return null;
        }
        String s = input.replace('đ', 'd').replace('Đ', 'D');
        return DIACRITICS.matcher(Normalizer.normalize(s, Normalizer.Form.NFD)).replaceAll("");
    }

    /** "Chả lụa Đặc biệt 500g" -> "cha-lua-dac-biet-500g". */
    public static String slugify(String input) {
        String s = unaccent(input == null ? "" : input).toLowerCase(Locale.ROOT);
        s = NON_SLUG.matcher(s).replaceAll("-");
        return s.replaceAll("(^-+|-+$)", "");
    }

    /** Escape ký tự đặc biệt của LIKE (%, _ và \). */
    public static String escapeLike(String input) {
        return input.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
