package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.service.model.UserContact;
import java.util.Optional;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.EmailAddress;
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

    /** SĐT của tài khoản – rỗng nếu tài khoản không tồn tại hoặc đăng ký bằng email. */
    @Transactional(readOnly = true)
    public Optional<PhoneNumber> findPhone(UUID userId) {
        return users.findById(userId).map(u -> u.getPhone());
    }

    /** SĐT + email của tài khoản. Email chỉ trả khi đúng định dạng (tên đăng nhập admin như "admin" bị bỏ qua). */
    @Transactional(readOnly = true)
    public Optional<UserContact> findContact(UUID userId) {
        return users.findById(userId).map(u -> new UserContact(u.getPhone(),
                EmailAddress.isValid(u.getEmail()) ? EmailAddress.of(u.getEmail()) : null, u.getFullName()));
    }
}
