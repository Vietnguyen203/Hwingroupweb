package com.vietnl.hwin.common.web;

import jakarta.servlet.http.HttpServletRequest;

import com.vietnl.hwin.common.util.Hashing;

/**
 * IP + User-Agent của client. Khi request đi qua proxy Next.js (cùng máy), lấy IP từ X-Forwarded-For.
 */
public record ClientInfo(String ip, String userAgent) {

    public static ClientInfo from(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank() && isLoopback(ip)) {
            ip = forwarded.split(",")[0].trim();
        }
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 255) {
            ua = ua.substring(0, 255);
        }
        return new ClientInfo(ip, ua);
    }

    /** IP băm SHA-256 để lưu trữ/so trùng mà không giữ IP gốc. */
    public String ipHash() {
        return Hashing.sha256Hex("ip:" + ip);
    }

    private static boolean isLoopback(String ip) {
        return "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip);
    }
}
