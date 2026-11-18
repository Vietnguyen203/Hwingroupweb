package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.service.AuthService;
import com.vietnl.hwin.identity.service.config.OtpProperties;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.model.RegisterAccountCommand;

/**
 * Đăng ký lỗi ở bước sau khi nhập đúng OTP (VD CCCD đã dùng): OTP vẫn còn để người dùng sửa thông tin và gửi lại,
 * nhưng mỗi lần lỗi tính 1 lần thử nên không dùng một OTP để dò CCCD hàng loạt.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class RegisterOtpRetryTests {

    @Autowired AuthService auth;
    @Autowired DevOtpInbox inbox;
    @Autowired OtpProperties otpProps;

    private static ClientInfo client(String ip) {
        return new ClientInfo(ip, "junit");
    }

    private static String newEmail() {
        return "retry-" + UUID.randomUUID().toString().substring(0, 8) + "@gmail.com";
    }

    private static String newCitizenId() {
        return String.format("%012d", ThreadLocalRandom.current().nextLong(1_000_000_000_000L));
    }

    private static RegisterAccountCommand cmd(String citizenId) {
        return new RegisterAccountCommand("Khách Thử Lại", LocalDate.of(1995, 5, 20),
                "12 Xuân Thủy, Cầu Giấy, Hà Nội", citizenId, "Hwin@2026x");
    }

    private String otpFor(String email) {
        return inbox.latest(OtpTarget.email(EmailAddress.of(email)), OtpPurpose.REGISTER).orElseThrow();
    }

    private static void expectCode(ThrowingCallable call, String code) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseException.class, e -> assertThat(e.getCode()).isEqualTo(code));
    }

    /** Tạo sẵn một tài khoản để chiếm một số CCCD. */
    private String takenCitizenId(String ip) {
        String taken = newCitizenId();
        String email = newEmail();
        auth.requestRegisterOtp(null, email, client(ip));
        auth.registerWithOtp(null, email, otpFor(email), cmd(taken), client(ip));
        return taken;
    }

    @Test
    void duplicateCitizenIdKeepsOtpSoUserCanFixAndRetry() {
        String taken = takenCitizenId("10.2.0.1");
        String email = newEmail();
        auth.requestRegisterOtp(null, email, client("10.2.0.2"));
        String code = otpFor(email);

        expectCode(() -> auth.registerWithOtp(null, email, code, cmd(taken), client("10.2.0.2")), "CITIZEN_ID_IN_USE");

        // Cùng OTP, sửa lại CCCD -> thành công (không phải xin OTP mới)
        var tokens = auth.registerWithOtp(null, email, code, cmd(newCitizenId()), client("10.2.0.2"));
        assertThat(tokens.userId()).isNotNull();

        // OTP vẫn chỉ dùng được cho một lần đăng ký thành công
        expectCode(() -> auth.registerWithOtp(null, email, code, cmd(newCitizenId()), client("10.2.0.2")), "OTP_EXPIRED");
    }

    @Test
    void failedRegistrationsAreCountedSoOtpCannotProbeCitizenIds() {
        String taken = takenCitizenId("10.2.0.3");
        String email = newEmail();
        auth.requestRegisterOtp(null, email, client("10.2.0.4"));
        String code = otpFor(email);

        for (int i = 0; i < otpProps.maxAttempts(); i++) {
            expectCode(() -> auth.registerWithOtp(null, email, code, cmd(taken), client("10.2.0.4")), "CITIZEN_ID_IN_USE");
        }
        // Hết lượt thử -> OTP bị hủy, phải xin OTP mới
        expectCode(() -> auth.registerWithOtp(null, email, code, cmd(newCitizenId()), client("10.2.0.4")), "OTP_EXPIRED");
    }
}
