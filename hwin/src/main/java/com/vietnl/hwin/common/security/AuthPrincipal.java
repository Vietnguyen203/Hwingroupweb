package com.vietnl.hwin.common.security;

import java.util.Set;

/**
 * Người dùng đã xác thực (lấy từ access token). Controller nhận qua {@code @AuthenticationPrincipal}.
 * Mọi API "của tôi" dùng {@code userId} này, KHÔNG nhận userId từ client (chống IDOR).
 */
public record AuthPrincipal(Long userId, Set<String> roles) {

    public boolean hasRole(String role) {
        return roles.contains(role);
    }
}
