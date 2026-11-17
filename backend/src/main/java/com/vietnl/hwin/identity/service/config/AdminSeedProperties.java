package com.vietnl.hwin.identity.service.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/**
 * @param otpExempt chỉ được true ở profile dev (tài khoản admin/admin)
 */
@ConfigurationProperties(prefix = "hwin.admin-seed")
public record AdminSeedProperties(String email, String password, String fullName, String phone, boolean otpExempt) {
}
