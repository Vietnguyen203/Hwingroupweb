package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.AdminAccountService;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;
import java.time.LocalDate;
import java.util.UUID;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

/**
 * Chống dò tài khoản ở đăng nhập chung: không tồn tại / chưa có mật khẩu / là admin / sai mật khẩu đều trả CÙNG một lỗi
 * (401 INVALID_LOGIN); chỉ người nhập đúng mật khẩu admin mới được báo "dùng cổng quản trị"; admin không bị khóa từ xa.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class LoginEnumerationTests {

    private static final String PASSWORD = "Hwin@2026x";
    private static final String ADMIN_PASSWORD = "Quan-tri-2026-xyz";

    @Autowired AuthService auth;
    @Autowired UserAccountService users;
    @Autowired AdminAccountService admins;
    @Autowired DevOtpInbox inbox;

    private static ClientInfo client(String ip) {
        return new ClientInfo(ip, "junit");
    }

    private void registerCustomer(String email, String cccd, String ip) {
        auth.requestRegisterOtp(null, email, client(ip));
        String code = inbox.latest(OtpTarget.email(EmailAddress.of(email)), OtpPurpose.REGISTER).orElseThrow();
        auth.registerWithOtp(null, email, code,
                new RegisterAccountCommand("Khách Thử", LocalDate.of(1995, 5, 20), "12 Xuân Thủy, Hà Nội", cccd, PASSWORD), client(ip));
    }

    private String createAdmin(String login, String phone) {
        return admins.create(login, ADMIN_PASSWORD, "Admin thử", phone, UUID.randomUUID(), UserAccount::getEmail);
    }

    private static void assertGenericFailure(Runnable attempt) {
        assertThatThrownBy(attempt::run).isInstanceOfSatisfying(ResponseException.class, e -> {
            assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(e.getCode()).isEqualTo("INVALID_LOGIN");
        });
    }

    @Test
    void everyFailureBeforeThePasswordIsVerifiedLooksTheSame() {
        registerCustomer("enum.customer@hwin.vn", "001095100001", "10.2.0.1");
        String adminLogin = createAdmin("enum.admin@hwin.vn", "0944100001");
        users.loginByPhone(PhoneNumber.of("0966300001")); // tài khoản chưa có mật khẩu

        Consumer<String[]> attempt = a -> auth.login(a[0], a[1], null, client(a[2]));
        assertGenericFailure(() -> attempt.accept(new String[]{"khong.ton.tai@hwin.vn", "Sai@mat-khau1", "10.2.1.1"}));
        assertGenericFailure(() -> attempt.accept(new String[]{"enum.customer@hwin.vn", "Sai@mat-khau1", "10.2.1.2"}));
        assertGenericFailure(() -> attempt.accept(new String[]{adminLogin, "Sai@mat-khau1", "10.2.1.3"}));
        assertGenericFailure(() -> attempt.accept(new String[]{"0966300001", "Sai@mat-khau1", "10.2.1.4"}));
    }

    @Test
    void onlySomeoneWhoKnowsTheAdminPasswordIsToldToUseTheAdminPortal() {
        String adminLogin = createAdmin("enum.admin2@hwin.vn", "0944100002");
        assertThatThrownBy(() -> auth.login(adminLogin, ADMIN_PASSWORD, null, client("10.2.2.1")))
                .hasFieldOrPropertyWithValue("code", "ADMIN_USE_ADMIN_LOGIN");
    }

    @Test
    void adminCannotBeLockedOutRemotelyThroughTheCustomerLogin() {
        String adminLogin = createAdmin("enum.admin3@hwin.vn", "0944100003");
        // 8 lần sai từ 8 địa chỉ khác nhau (kẻ tấn công cố khóa tài khoản admin)
        for (int i = 0; i < 8; i++) {
            String ip = "10.2.3." + i;
            assertGenericFailure(() -> auth.login(adminLogin, "Sai@mat-khau1", null, client(ip)));
        }
        // admin thật vẫn nhập đúng mật khẩu và được hướng dẫn sang cổng quản trị (không bị 429)
        assertThatThrownBy(() -> auth.login(adminLogin, ADMIN_PASSWORD, null, client("10.2.3.99")))
                .hasFieldOrPropertyWithValue("code", "ADMIN_USE_ADMIN_LOGIN");
    }

    @Test
    void customerAccountsAreStillLockedAfterTooManyWrongPasswords() {
        registerCustomer("enum.lock@hwin.vn", "001095100002", "10.2.4.200");
        for (int i = 0; i < 5; i++) {
            String ip = "10.2.4." + i;
            assertGenericFailure(() -> auth.login("enum.lock@hwin.vn", "Sai@mat-khau1", null, client(ip)));
        }
        assertThatThrownBy(() -> auth.login("enum.lock@hwin.vn", PASSWORD, null, client("10.2.4.99")))
                .hasFieldOrPropertyWithValue("code", "LOGIN_LOCKED");
    }

    @Test
    void adminPortalAlsoGivesTheSameErrorForUnknownAndWrongPassword() {
        String adminLogin = createAdmin("enum.admin4@hwin.vn", "0944100004");
        assertThatThrownBy(() -> auth.adminLogin("khong.co.admin@hwin.vn", "Sai@mat-khau1", client("10.2.5.1")))
                .hasFieldOrPropertyWithValue("code", "BAD_CREDENTIALS");
        assertThatThrownBy(() -> auth.adminLogin(adminLogin, "Sai@mat-khau1", client("10.2.5.2")))
                .hasFieldOrPropertyWithValue("code", "BAD_CREDENTIALS");
    }
}
