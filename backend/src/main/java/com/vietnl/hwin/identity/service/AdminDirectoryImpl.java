package com.vietnl.hwin.identity.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.notification.AdminDirectory;
import com.vietnl.hwin.identity.entity.Role;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.entity.UserStatus;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/** Cho shared kernel biết các tài khoản admin đang hoạt động (để gửi thông báo cho admin). */
@Component
class AdminDirectoryImpl implements AdminDirectory {

    private final UserAccountRepository users;

    AdminDirectoryImpl(UserAccountRepository users) {
        this.users = users;
    }

    @Override
    public List<UUID> activeAdminIds() {
        return users.findByRolesContains(Role.ADMIN).stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .map(UserAccount::getId)
                .toList();
    }
}
