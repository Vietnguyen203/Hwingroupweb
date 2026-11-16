package com.vietnl.hwin.affiliate.service;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.affiliate.entity.AffiliateApproved;
import com.vietnl.hwin.affiliate.entity.AffiliateSuspended;
import com.vietnl.hwin.identity.service.UserRoleService;

/**
 * Đồng bộ vai trò AFFILIATE bên identity theo trạng thái CTV.
 * Listener đặt ở affiliate (gọi service công bố của identity) để giữ phụ thuộc một chiều affiliate -> identity.
 * Vai trò mới có hiệu lực ở access token kế tiếp (sau /api/auth/refresh hoặc đăng nhập lại).
 */
@Component
public class AffiliateRoleListener {

    private final UserRoleService roles;

    public AffiliateRoleListener(UserRoleService roles) {
        this.roles = roles;
    }

    @ApplicationModuleListener
    void on(AffiliateApproved event) {
        roles.grantAffiliate(event.userId());
    }

    @ApplicationModuleListener
    void on(AffiliateSuspended event) {
        roles.revokeAffiliate(event.userId());
    }
}
