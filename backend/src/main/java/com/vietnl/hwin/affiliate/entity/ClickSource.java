package com.vietnl.hwin.affiliate.entity;

import java.util.Locale;

/** Nền tảng mà khách bấm link CTV từ đó (tham số ?src= của link chia sẻ). */
public enum ClickSource {
    FACEBOOK,
    ZALO,
    TIKTOK,
    YOUTUBE,
    INSTAGRAM,
    /** Khác / link không gắn src / giá trị lạ. */
    OTHER;

    /** Đọc giá trị src do khách gửi lên (không phân biệt hoa thường); rỗng hoặc không nhận ra thì là {@link #OTHER}. */
    public static ClickSource parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return OTHER;
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        for (ClickSource s : values()) {
            if (s.name().equals(value)) {
                return s;
            }
        }
        return OTHER;
    }
}
