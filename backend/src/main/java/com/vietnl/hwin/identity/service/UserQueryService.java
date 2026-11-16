package com.vietnl.hwin.identity.service;

import java.util.UUID;

import java.util.Optional;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Service công bố cho module khác đọc thông tin tài khoản (ví dụ affiliate kiểm tra tự giới thiệu).
 */
@Service
@NamedInterface("services")
public class UserQueryService {

    private final UserAccountRepository users;

    public UserQueryService(UserAccountRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Optional<PhoneNumber> findPhone(UUID userId) {
        return users.findById(userId).map(u -> u.getPhone());
    }
}
