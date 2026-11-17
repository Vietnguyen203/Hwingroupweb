package com.vietnl.hwin.affiliate.service.listener;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.affiliate.entity.event.AffiliateApprovedEvent;
import com.vietnl.hwin.affiliate.entity.event.AffiliateSuspendedEvent;
import com.vietnl.hwin.identity.service.UserRoleService;

/**
 * Đồng bộ vai trò AFFILIATE bên identity theo trạng thái CTV.
 * Listener đặt ở affiliate (gọi service công bố của identity) để giữ phụ thuộc một chiều affiliate -> identity.
 * Vai trò mới có hiệu lực ở access token kế tiếp (sau /api/auth/refresh hoặc đăng nhập lại).
 */
@Component
public class AffiliateRoleEventListener {

    private final UserRoleService roles;

    public AffiliateRoleEventListener(UserRoleService roles) {
        this.roles = roles;
    }

    @ApplicationModuleListener
    void on(AffiliateApprovedEvent event) {
        roles.grantAffiliate(event.userId());
    }

    @ApplicationModuleListener
    void on(AffiliateSuspendedEvent event) {
        roles.revokeAffiliate(event.userId());
    }
}
