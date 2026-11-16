package com.vietnl.hwin.identity.service;

import java.util.UUID;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.identity.entity.Role;

/**
 * Service công bố để module affiliate cấp/gỡ vai trò AFFILIATE khi CTV được duyệt/tạm khóa.
 * Không lộ enum Role ra ngoài module.
 */
@Service
@NamedInterface("services")
public class UserRoleService {

    private final UserAccountService userAccountService;

    public UserRoleService(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @Transactional
    public void grantAffiliate(UUID userId) {
        userAccountService.get(userId).grantRole(Role.AFFILIATE);
    }

    @Transactional
    public void revokeAffiliate(UUID userId) {
        userAccountService.get(userId).revokeRole(Role.AFFILIATE);
    }
}
