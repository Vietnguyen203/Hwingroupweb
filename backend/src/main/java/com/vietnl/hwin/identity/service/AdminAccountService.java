package com.vietnl.hwin.identity.service;

import com.vietnl.hwin.identity.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.Role;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * Admin tạo / xem tài khoản quản trị. Tài khoản tạo qua API LUÔN phải đăng nhập 2 bước (mật khẩu + OTP):
 * không có cách nào bật miễn OTP qua API.
 */
@Service
public class AdminAccountService {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountService.class);

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountService(UserAccountRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public <T> T create(String email, String password, String fullName, String rawPhone, UUID createdBy,
                        Function<UserAccount, T> mapper) {
        String login = email == null ? "" : email.trim().toLowerCase();
        PasswordPolicy.validate(password, login);
        PhoneNumber phone = rawPhone == null || rawPhone.isBlank() ? null : PhoneNumber.of(rawPhone);
        if (users.existsByEmail(login)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.EMAIL_IN_USE);
        }
        if (phone != null && users.findByPhone(phone).isPresent()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_IN_USE);
        }
        UserAccount admin = users.save(UserAccount.createAdmin(login, passwordEncoder.encode(password), fullName, phone));
        log.info("Admin {} tạo tài khoản quản trị {}", createdBy, login);
        return mapper.apply(admin);
    }

    @Transactional(readOnly = true)
    public <T> List<T> list(Function<UserAccount, T> mapper) {
        return users.findByRolesContains(Role.ADMIN).stream().map(mapper).toList();
    }
}
