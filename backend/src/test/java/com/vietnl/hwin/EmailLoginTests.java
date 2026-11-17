package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.customer.service.CustomerService;
import com.vietnl.hwin.customer.service.model.CustomerProfile;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.PasswordPolicy;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.config.OtpProperties;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.integration.SimulatedSmsOtpSender;
import com.vietnl.hwin.identity.service.model.LoginResult;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;
import com.vietnl.hwin.identity.service.model.SendOtpResult;

/**
 * Tài khoản khách: đăng ký đủ thông tin (email HOẶC SĐT + họ tên, ngày sinh, địa chỉ, CCCD, mật khẩu theo Password Policy),
 * đăng nhập = email / SĐT + mật khẩu + OTP, "ghi nhớ đăng nhập" 30 ngày bỏ qua OTP, thêm SĐT cho tài khoản email.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class EmailLoginTests {

    private static final String PASSWORD = "Hwin@2026x";
    private static final LocalDate DOB = LocalDate.of(1995, 5, 20);

    @Autowired AuthService auth;
    @Autowired UserAccountService users;
    @Autowired CustomerService customers;
    @Autowired AffiliateService affiliates;
    @Autowired DevOtpInbox inbox;

    private static ClientInfo client(String ip) {
        return new ClientInfo(ip, "junit");
    }

    private String otp(OtpTarget target, OtpPurpose purpose) {
        return inbox.latest(target, purpose).orElseThrow();
    }

    private static RegisterAccountCommand cmd(String name, String cccd) {
        return new RegisterAccountCommand(name, DOB, "12 Xuân Thủy, Cầu Giấy, Hà Nội", cccd, PASSWORD);
    }

    private UUID registerByEmail(String email, String cccd, String ip) {
        auth.requestRegisterOtp(null, email, client(ip));
        return auth.registerWithOtp(null, email, otp(OtpTarget.email(EmailAddress.of(email)), OtpPurpose.REGISTER),
                cmd("Khách Email", cccd), client(ip)).userId();
    }

    @Test
    void registerByEmailWithFullProfile() {
        SendOtpResult sent = auth.requestRegisterOtp(null, "  Khach.Email@Gmail.com ", client("10.1.0.1"));
        assertThat(sent.channel()).isEqualTo(OtpChannel.EMAIL);
        assertThat(sent.sentTo()).isEqualTo("kh******@gmail.com");

        String code = otp(OtpTarget.email(EmailAddress.of("khach.email@gmail.com")), OtpPurpose.REGISTER);
        UUID userId = auth.registerWithOtp(null, "KHACH.EMAIL@gmail.com", code, cmd("Nguyễn Văn Email", "001095000001"),
                client("10.1.0.1")).userId();
        UserAccount user = users.get(userId);
        assertThat(user.getEmail()).isEqualTo("khach.email@gmail.com");
        assertThat(user.getPhone()).isNull();
        assertThat(user.getFullName()).isEqualTo("Nguyễn Văn Email");
        assertThat(user.getDateOfBirth()).isEqualTo(DOB);
        assertThat(user.citizenIdMasked()).isEqualTo("********0001");
        assertThat(user.getCitizenIdEncrypted()).doesNotContain("001095000001");
        assertThat(user.getPasswordHash()).isNotEqualTo(PASSWORD).startsWith("$2");

        customers.ensureCustomer(userId);
        CustomerProfile profile = customers.profile(userId, p -> p);
        assertThat(profile.customer().getFullName()).isEqualTo("Nguyễn Văn Email");

        assertThatThrownBy(() -> auth.requestRegisterOtp(null, "khach.email@gmail.com", client("10.1.0.2")))
                .hasFieldOrPropertyWithValue("code", "ACCOUNT_EXISTS");
    }

    @Test
    void registerRejectsDuplicateCitizenIdAndFutureBirthDate() {
        registerByEmail("cccd1@hwin.vn", "001095000002", "10.1.0.3");

        auth.requestRegisterOtp(null, "cccd2@hwin.vn", client("10.1.0.3"));
        String code = otp(OtpTarget.email(EmailAddress.of("cccd2@hwin.vn")), OtpPurpose.REGISTER);
        assertThatThrownBy(() -> auth.registerWithOtp(null, "cccd2@hwin.vn", code, cmd("Trùng CCCD", "001095000002"), client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "CITIZEN_ID_IN_USE");

        auth.requestRegisterOtp(null, "future@hwin.vn", client("10.1.0.3"));
        String code2 = otp(OtpTarget.email(EmailAddress.of("future@hwin.vn")), OtpPurpose.REGISTER);
        var future = new RegisterAccountCommand("Tương Lai", LocalDate.now().plusDays(1), "HN", "001095000003", PASSWORD);
        assertThatThrownBy(() -> auth.registerWithOtp(null, "future@hwin.vn", code2, future, client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "DATE_OF_BIRTH_INVALID");
    }

    @Test
    void passwordPolicyForCustomers() {
        for (String weak : new String[] {"Ab1!", "abcdefg1!", "ABCDEFG1!", "Abcdefgh!", "Abcdefg12", "Ab 1!cdefg"}) {
            assertThatThrownBy(() -> PasswordPolicy.validateCustomer(weak, "a@b.vn"))
                    .isInstanceOf(ResponseException.class).hasFieldOrPropertyWithValue("code", "WEAK_PASSWORD");
        }
        assertThatThrownBy(() -> PasswordPolicy.validateCustomer("Nguyenvan@1", "nguyenvan@gmail.com"))
                .hasFieldOrPropertyWithValue("code", "WEAK_PASSWORD");
        assertThatThrownBy(() -> PasswordPolicy.validateCustomer("Pass@912345678", "0912345678"))
                .hasFieldOrPropertyWithValue("code", "WEAK_PASSWORD");
        PasswordPolicy.validateCustomer(PASSWORD, "a@b.vn", "0912345678");
    }

    @Test
    void loginWithPasswordThenOtpAndRememberDeviceFor30Days() {
        UUID userId = registerByEmail("login@hwin.vn", "001095000004", "10.1.0.4");
        OtpTarget target = OtpTarget.email(EmailAddress.of("login@hwin.vn"));

        assertThatThrownBy(() -> auth.login("login@hwin.vn", "Sai@mat-khau1", null, client("10.1.0.4")))
                .hasFieldOrPropertyWithValue("code", "INVALID_LOGIN");

        LoginResult step1 = auth.login("LOGIN@hwin.vn", PASSWORD, null, client("10.1.0.4"));
        assertThat(step1.otpRequired()).isTrue();
        assertThat(step1.sentTo()).isEqualTo("lo******@hwin.vn");
        LoginResult step2 = auth.verifyLoginOtp(step1.challengeId(), otp(target, OtpPurpose.LOGIN), true, client("10.1.0.4"));
        assertThat(step2.tokens().userId()).isEqualTo(userId);
        assertThat(step2.trustedDeviceToken()).isNotBlank();

        // thiết bị đã ghi nhớ -> chỉ cần mật khẩu, không hỏi OTP
        LoginResult again = auth.login("login@hwin.vn", PASSWORD, step2.trustedDeviceToken(), client("10.1.0.4"));
        assertThat(again.otpRequired()).isFalse();
        assertThat(again.tokens().userId()).isEqualTo(userId);
        // token thiết bị sai -> vẫn phải OTP
        assertThat(auth.login("login@hwin.vn", PASSWORD, "token-gia", client("10.1.0.4")).otpRequired()).isTrue();
    }

    @Test
    void tooManyWrongPasswordsLocksLogin() {
        registerByEmail("lock@hwin.vn", "001095000005", "10.1.0.5");
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> auth.login("lock@hwin.vn", "Sai@mat-khau1", null, client("10.1.0.5")))
                    .hasFieldOrPropertyWithValue("code", "INVALID_LOGIN");
        }
        assertThatThrownBy(() -> auth.login("lock@hwin.vn", PASSWORD, null, client("10.1.0.5")))
                .hasFieldOrPropertyWithValue("code", "LOGIN_LOCKED");
    }

    @Test
    void emailAccountAddsPhoneThenLogsInByPhone() {
        UUID userId = registerByEmail("addphone@hwin.vn", "001095000006", "10.1.0.6");

        users.requestAddPhoneOtp(userId, "0955000106", "ip-add-phone");
        OtpTarget phone = OtpTarget.phone(PhoneNumber.of("0955000106"));
        assertThatThrownBy(() -> users.addPhone(userId, "0955000106", "000000")).hasFieldOrPropertyWithValue("code", "OTP_INVALID");
        UserAccount user = users.addPhone(userId, "0955000106", otp(phone, OtpPurpose.ADD_PHONE));
        assertThat(user.getPhone().local()).isEqualTo("0955000106");

        LoginResult step1 = auth.login("0955 000 106", PASSWORD, null, client("10.1.0.7"));
        assertThat(step1.sentTo()).isEqualTo("09******06");
        assertThat(auth.verifyLoginOtp(step1.challengeId(), otp(phone, OtpPurpose.LOGIN), false, client("10.1.0.7"))
                .tokens().userId()).isEqualTo(userId);

        assertThatThrownBy(() -> users.requestAddPhoneOtp(userId, "0955000107", "ip-add-phone"))
                .hasFieldOrPropertyWithValue("code", "PHONE_ALREADY_SET");
    }

    @Test
    void wrongLoginOtpRejected() {
        registerByEmail("tach@hwin.vn", "001095000007", "10.1.0.8");
        LoginResult step1 = auth.login("tach@hwin.vn", PASSWORD, null, client("10.1.0.8"));
        assertThatThrownBy(() -> auth.verifyLoginOtp(step1.challengeId(), "000000", false, client("10.1.0.8")))
                .hasFieldOrPropertyWithValue("code", "OTP_INVALID");
    }

    @Test
    void phoneOrEmailButNotBoth() {
        assertThatThrownBy(() -> auth.requestRegisterOtp("0955000001", "a@hwin.vn", client("10.1.0.9")))
                .hasFieldOrPropertyWithValue("code", "CONTACT_REQUIRED");
        assertThatThrownBy(() -> auth.requestRegisterOtp(null, "khong-phai-email", client("10.1.0.9")))
                .hasFieldOrPropertyWithValue("code", "EMAIL_INVALID");
    }

    @Test
    void emailAccountMustGivePhoneToBecomeCtvAndGetsBankOtpByEmail() {
        UUID userId = registerByEmail("ctv.email@gmail.com", "001095000008", "10.1.0.10");
        assertThatThrownBy(() -> affiliates.register(userId, "CTV Email", null, null, null, a -> a))
                .hasFieldOrPropertyWithValue("code", "PHONE_REQUIRED");
        Affiliate a = affiliates.register(userId, "CTV Email", null, null, "0955000002", x -> x);
        assertThat(a.getPhone().local()).isEqualTo("0955000002");
        affiliates.sendBankChangeOtp(userId, "ip-bank");
        assertThat(inbox.latest(OtpTarget.email(EmailAddress.of("ctv.email@gmail.com")), OtpPurpose.BANK_CHANGE)).isPresent();
    }

    @Test
    void smsIsUnavailableOutsideDev() {
        OtpProperties prod = new OtpProperties(Duration.ofMinutes(5), 5, Duration.ofMinutes(15), 3, 3,
                Duration.ofMinutes(10), "pepper", false);
        assertThat(new SimulatedSmsOtpSender(prod).available()).isFalse();
    }
}
