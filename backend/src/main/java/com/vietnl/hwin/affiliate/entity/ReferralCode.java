package com.vietnl.hwin.affiliate.entity;

import java.security.SecureRandom;
import java.util.regex.Pattern;

import com.vietnl.hwin.common.exception.DomainException;

/**
 * Value object: mã giới thiệu của CTV – 6..10 ký tự A-Z, 0-9 (in hoa).
 * Mã sinh tự động dùng bảng chữ bỏ ký tự dễ nhầm (0/O, 1/I).
 */
public record ReferralCode(String value) {

    private static final Pattern FORMAT = Pattern.compile("^[A-Z0-9]{6,10}$");
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public ReferralCode {
        if (value == null || !FORMAT.matcher(value).matches()) {
            throw new DomainException("REFERRAL_CODE_INVALID", "Mã giới thiệu không hợp lệ");
        }
    }

    /** Chuẩn hóa chuỗi người dùng nhập/URL; null nếu sai định dạng (không ném lỗi). */
    public static ReferralCode parseOrNull(String raw) {
        if (raw == null) {
            return null;
        }
        String v = raw.trim().toUpperCase();
        return FORMAT.matcher(v).matches() ? new ReferralCode(v) : null;
    }

    public static ReferralCode generate() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return new ReferralCode(sb.toString());
    }

    @Override
    public String toString() {
        return value;
    }
}
