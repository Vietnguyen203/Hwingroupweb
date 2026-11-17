package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.AdminAccountService;
import com.vietnl.hwin.identity.service.AdminLoginResult;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.IssuedTokens;
import com.vietnl.hwin.identity.service.PasswordPolicy;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;

/**
 * Đăng nhập admin 2 bước: role ADMIN luôn cần mật khẩu + OTP (miễn OTP chỉ gắn với tài khoản dev admin/admin).
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class AdminAuthTests {

    @Autowired AdminAccountService admins;
    @Autowired AuthService auth;
    @Autowired UserAccountService users;
    @Autowired DevOtpInbox otpInbox;

    private static final String PASSWORD = "Quan-tri-2026-xyz";

    private String createAdmin(String login, String phone) {
        return admins.create(login, PASSWORD, "Admin test", phone, UUID.randomUUID(), UserAccount::getEmail);
    }

    @Test
    void adminLoginRequiresPasswordThenOtp() {
        String login = createAdmin("ops@hwin.vn", "0944000001");
        ClientInfo client = new ClientInfo("10.0.0.1", "junit");

        AdminLoginResult step1 = auth.adminLogin(login, PASSWORD, client);
        assertThat(step1.otpRequired()).isTrue();
        assertThat(step1.tokens()).isNull();
        assertThat(step1.phoneMasked()).isEqualTo("09******01");

        assertThatThrownBy(() -> auth.verifyAdminOtp(step1.challengeId(), "000000", client))
                .hasFieldOrPropertyWithValue("code", "OTP_INVALID");
        String otp = otpInbox.latest(PhoneNumber.of("0944000001"), OtpPurpose.ADMIN_LOGIN).orElseThrow();
        IssuedTokens tokens = auth.verifyAdminOtp(step1.challengeId(), otp, client);
        assertThat(tokens.accessToken()).isNotBlank();

        // challenge chỉ dùng 1 lần
        assertThatThrownBy(() -> auth.verifyAdminOtp(step1.challengeId(), otp, client))
                .hasFieldOrPropertyWithValue("code", "CHALLENGE_EXPIRED");
    }

    @Test
    void wrongPasswordRejectedWithoutSendingOtp() {
        String login = createAdmin("ops2@hwin.vn", "0944000002");
        assertThatThrownBy(() -> auth.adminLogin(login, "Sai-mat-khau-123", new ClientInfo("10.0.0.2", "junit")))
                .hasFieldOrPropertyWithValue("code", "BAD_CREDENTIALS");
        assertThat(otpInbox.latest(PhoneNumber.of("0944000002"), OtpPurpose.ADMIN_LOGIN)).isEmpty();
    }

    @Test
    void adminCannotLoginThroughCustomerOtp() {
        createAdmin("ops3@hwin.vn", "0944000003");
        assertThatThrownBy(() -> users.loginByPhone(PhoneNumber.of("0944000003")))
                .hasFieldOrPropertyWithValue("code", "ADMIN_USE_ADMIN_LOGIN");
    }

    @Test
    void createAdminRequiresStrongPasswordAndUniquePhone() {
        assertThatThrownBy(() -> admins.create("weak@hwin.vn", "admin12345678", null, "0944000004", UUID.randomUUID(), u -> u))
                .hasFieldOrPropertyWithValue("code", "WEAK_PASSWORD");
        users.loginByPhone(PhoneNumber.of("0944000005")); // SĐT đã là của một khách
        assertThatThrownBy(() -> admins.create("dup@hwin.vn", PASSWORD, null, "0944000005", UUID.randomUUID(), u -> u))
                .hasFieldOrPropertyWithValue("code", "PHONE_IN_USE");
    }

    @Test
    void devAdminIsOtpExemptButRegularAdminIsNot() {
        UserAccount dev = UserAccount.createDevAdmin("admin", "hash", "Dev");
        UserAccount real = UserAccount.createAdmin("ops@hwin.vn", "hash", "Ops", PhoneNumber.of("0944000009"));
        assertThat(dev.isOtpExempt()).isTrue();
        assertThat(real.isOtpExempt()).isFalse();
        assertThatThrownBy(() -> UserAccount.createAdmin("x@hwin.vn", "hash", "X", null))
                .hasFieldOrPropertyWithValue("code", "ADMIN_PHONE_REQUIRED");
    }

    @Test
    void passwordPolicy() {
        assertThatThrownBy(() -> PasswordPolicy.validate("short1", "a")).isInstanceOf(DomainException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("onlyletterslong", "a")).isInstanceOf(DomainException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("myadminpass2026", "a")).isInstanceOf(DomainException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("nguyenvana-2026", "nguyenvana@hwin.vn")).isInstanceOf(DomainException.class);
        PasswordPolicy.validate(PASSWORD, "ops@hwin.vn");
    }
}
