package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.customer.service.CustomerService;
import com.vietnl.hwin.customer.service.CustomerService.Profile;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.AuthService.OtpDispatch;
import com.vietnl.hwin.identity.service.OtpProperties;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.integration.SimulatedSmsOtpSender;

/**
 * Đăng ký / đăng nhập (tách riêng) bằng email HOẶC SĐT: OTP gửi tới đúng nơi khách đã nhập; tài khoản email chưa có SĐT.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class EmailLoginTests {

    @Autowired AuthService auth;
    @Autowired UserAccountService users;
    @Autowired CustomerService customers;
    @Autowired AffiliateService affiliates;
    @Autowired DevOtpInbox inbox;

    private static ClientInfo client(String ip) {
        return new ClientInfo(ip, "junit");
    }

    private String otp(String email, OtpPurpose purpose) {
        return inbox.latest(OtpTarget.email(EmailAddress.of(email)), purpose).orElseThrow();
    }

    private UUID registerByEmail(String email, String ip) {
        auth.requestOtp(null, email, true, client(ip));
        return auth.registerWithOtp(null, email, otp(email, OtpPurpose.REGISTER), "Khách Email", client(ip)).userId();
    }

    @Test
    void registerByEmailThenLogin() {
        OtpDispatch sent = auth.requestOtp(null, "  Khach.Email@Gmail.com ", true, client("10.1.0.1"));
        assertThat(sent.channel()).isEqualTo(OtpChannel.EMAIL);
        assertThat(sent.sentTo()).isEqualTo("kh******@gmail.com");

        String code = otp("khach.email@gmail.com", OtpPurpose.REGISTER);
        UUID userId = auth.registerWithOtp(null, "KHACH.EMAIL@gmail.com", code, "Nguyễn Văn Email", client("10.1.0.1")).userId();
        UserAccount user = users.get(userId);
        assertThat(user.getEmail()).isEqualTo("khach.email@gmail.com");
        assertThat(user.getPhone()).isNull();
        assertThat(user.getFullName()).isEqualTo("Nguyễn Văn Email");

        // hồ sơ khách tạo được dù không có SĐT, mang theo họ tên
        customers.ensureCustomer(userId);
        Profile profile = customers.profile(userId, p -> p);
        assertThat(profile.customer().getEmail()).isEqualTo("khach.email@gmail.com");
        assertThat(profile.customer().getPhone()).isNull();
        assertThat(profile.customer().getFullName()).isEqualTo("Nguyễn Văn Email");

        // đăng nhập lại cùng email -> cùng tài khoản
        auth.requestOtp(null, "khach.email@gmail.com", false, client("10.1.0.2"));
        assertThat(auth.loginWithOtp(null, "khach.email@gmail.com", otp("khach.email@gmail.com", OtpPurpose.LOGIN),
                client("10.1.0.2")).userId()).isEqualTo(userId);

        // đăng ký lại -> báo đã có tài khoản
        assertThatThrownBy(() -> auth.requestOtp(null, "khach.email@gmail.com", true, client("10.1.0.2")))
                .hasFieldOrPropertyWithValue("code", "ACCOUNT_EXISTS");
    }

    @Test
    void loginRequiresExistingAccount() {
        assertThatThrownBy(() -> auth.requestOtp(null, "chua-co@hwin.vn", false, client("10.1.0.6")))
                .hasFieldOrPropertyWithValue("code", "ACCOUNT_NOT_FOUND");
        assertThatThrownBy(() -> auth.requestOtp("0955000009", null, false, client("10.1.0.6")))
                .hasFieldOrPropertyWithValue("code", "ACCOUNT_NOT_FOUND");
        assertThat(inbox.latest(OtpTarget.email(EmailAddress.of("chua-co@hwin.vn")), OtpPurpose.LOGIN)).isEmpty();
    }

    @Test
    void registerOtpCannotBeUsedToLogin() {
        auth.requestOtp(null, "tach@hwin.vn", true, client("10.1.0.7"));
        String code = otp("tach@hwin.vn", OtpPurpose.REGISTER);
        assertThatThrownBy(() -> auth.loginWithOtp(null, "tach@hwin.vn", code, client("10.1.0.7")))
                .hasFieldOrPropertyWithValue("code", "OTP_EXPIRED");
    }

    @Test
    void phoneOrEmailButNotBoth() {
        assertThatThrownBy(() -> auth.requestOtp("0955000001", "a@hwin.vn", true, client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "CONTACT_REQUIRED");
        assertThatThrownBy(() -> auth.requestOtp(null, " ", true, client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "CONTACT_REQUIRED");
        assertThatThrownBy(() -> auth.requestOtp(null, "khong-phai-email", true, client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "EMAIL_INVALID");
    }

    @Test
    void otpForEmailDoesNotWorkForAnotherEmail() {
        auth.requestOtp(null, "mot@hwin.vn", true, client("10.1.0.4"));
        String code = otp("mot@hwin.vn", OtpPurpose.REGISTER);
        assertThatThrownBy(() -> auth.registerWithOtp(null, "hai@hwin.vn", code, "Hai", client("10.1.0.4")))
                .hasFieldOrPropertyWithValue("code", "OTP_EXPIRED");
    }

    @Test
    void emailAccountMustGivePhoneToBecomeCtvAndGetsBankOtpByEmail() {
        UUID userId = registerByEmail("ctv.email@gmail.com", "10.1.0.5");
        assertThatThrownBy(() -> affiliates.register(userId, "CTV Email", null, null, null, a -> a))
                .hasFieldOrPropertyWithValue("code", "PHONE_REQUIRED");

        Affiliate a = affiliates.register(userId, "CTV Email", null, null, "0955000002", x -> x);
        assertThat(a.getPhone().local()).isEqualTo("0955000002");

        affiliates.sendBankChangeOtp(userId, "ip-bank");
        assertThat(inbox.latest(OtpTarget.email(EmailAddress.of("ctv.email@gmail.com")), OtpPurpose.BANK_CHANGE))
                .isPresent();
    }

    @Test
    void smsIsUnavailableOutsideDev() {
        OtpProperties prod = new OtpProperties(Duration.ofMinutes(5), 5, Duration.ofMinutes(15), 3, 3,
                Duration.ofMinutes(10), "pepper", false);
        assertThat(new SimulatedSmsOtpSender(prod).available()).isFalse();
    }

    @Test
    void emailAddressNormalizeAndMask() {
        assertThat(EmailAddress.of(" An.Nguyen@Hwin.VN ").value()).isEqualTo("an.nguyen@hwin.vn");
        assertThat(EmailAddress.of("a@hwin.vn").masked()).isEqualTo("a******@hwin.vn");
        assertThat(EmailAddress.isValid("admin")).isFalse();
        assertThatThrownBy(() -> EmailAddress.of("a@b")).isInstanceOf(DomainException.class);
    }
}
