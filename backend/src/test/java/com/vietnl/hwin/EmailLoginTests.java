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
import com.vietnl.hwin.identity.service.IssuedTokens;
import com.vietnl.hwin.identity.service.OtpProperties;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.integration.SimulatedSmsOtpSender;

/**
 * Đăng nhập bằng email HOẶC SĐT: OTP gửi tới đúng nơi khách đã nhập; tài khoản email chưa có SĐT.
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

    private UUID loginByEmail(String email, String ip) {
        auth.requestLoginOtp(null, email, client(ip));
        IssuedTokens tokens = auth.loginWithOtp(null, email, otp(email, OtpPurpose.LOGIN), client(ip));
        return tokens.userId();
    }

    @Test
    void emailLoginCreatesAccountWithoutPhone() {
        OtpDispatch sent = auth.requestLoginOtp(null, "  Khach.Email@Gmail.com ", client("10.1.0.1"));
        assertThat(sent.channel()).isEqualTo(OtpChannel.EMAIL);
        assertThat(sent.sentTo()).isEqualTo("kh******@gmail.com");

        String code = otp("khach.email@gmail.com", OtpPurpose.LOGIN);
        UUID userId = auth.loginWithOtp(null, "KHACH.EMAIL@gmail.com", code, client("10.1.0.1")).userId();
        UserAccount user = users.get(userId);
        assertThat(user.getEmail()).isEqualTo("khach.email@gmail.com");
        assertThat(user.getPhone()).isNull();

        // hồ sơ khách tạo được dù không có SĐT
        customers.ensureCustomer(userId);
        Profile profile = customers.profile(userId, p -> p);
        assertThat(profile.customer().getEmail()).isEqualTo("khach.email@gmail.com");
        assertThat(profile.customer().getPhone()).isNull();

        // đăng nhập lại cùng email -> cùng tài khoản
        assertThat(loginByEmail("khach.email@gmail.com", "10.1.0.2")).isEqualTo(userId);
    }

    @Test
    void phoneOrEmailButNotBoth() {
        assertThatThrownBy(() -> auth.requestLoginOtp("0955000001", "a@hwin.vn", client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "CONTACT_REQUIRED");
        assertThatThrownBy(() -> auth.requestLoginOtp(null, " ", client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "CONTACT_REQUIRED");
        assertThatThrownBy(() -> auth.requestLoginOtp(null, "khong-phai-email", client("10.1.0.3")))
                .hasFieldOrPropertyWithValue("code", "EMAIL_INVALID");
    }

    @Test
    void otpForEmailDoesNotWorkForAnotherEmail() {
        auth.requestLoginOtp(null, "mot@hwin.vn", client("10.1.0.4"));
        String code = otp("mot@hwin.vn", OtpPurpose.LOGIN);
        assertThatThrownBy(() -> auth.loginWithOtp(null, "hai@hwin.vn", code, client("10.1.0.4")))
                .hasFieldOrPropertyWithValue("code", "OTP_EXPIRED");
    }

    @Test
    void emailAccountMustGivePhoneToBecomeCtvAndGetsBankOtpByEmail() {
        UUID userId = loginByEmail("ctv.email@gmail.com", "10.1.0.5");
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
