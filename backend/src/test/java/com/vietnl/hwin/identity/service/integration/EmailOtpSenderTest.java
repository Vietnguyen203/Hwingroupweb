package com.vietnl.hwin.identity.service.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.config.OtpProperties;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Email OTP: tên miền dành riêng (example.com, .test...) không bao giờ gửi thật; địa chỉ thật vẫn gửi.
 * Thư gửi NỀN: send() không chờ SMTP và không ném lỗi khi SMTP hỏng.
 */
class EmailOtpSenderTest {

    private static final String FROM = "Hwin Food <no-reply@hwin.vn>";

    @SuppressWarnings("unchecked")
    private static ObjectProvider<JavaMailSender> provider(JavaMailSender mail) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mail);
        return provider;
    }

    private static OtpProperties props() {
        return new OtpProperties(Duration.ofMinutes(5), 5, Duration.ofMinutes(15), 5, 50, Duration.ofMinutes(10), "pepper", true);
    }

    /** Gửi ngay trong luồng gọi (Runnable::run) để test không phải chờ luồng nền. */
    private static EmailOtpSender inlineSender(JavaMailSender mail) {
        return new EmailOtpSender(provider(mail), props(), "smtp.example", FROM, Runnable::run);
    }

    @Test
    void reservedDomainsAreNeverSent() {
        JavaMailSender mail = mock(JavaMailSender.class);
        EmailOtpSender sender = inlineSender(mail);
        for (String to : new String[]{"khach123@example.com", "a@EXAMPLE.org", "b@mail.example.net", "c@nha.test", "d@x.invalid", "e@host.localhost"}) {
            sender.send(to, "123456", OtpPurpose.REGISTER);
        }
        verify(mail, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void realAddressesAreStillSent() {
        JavaMailSender mail = mock(JavaMailSender.class);
        inlineSender(mail).send("nguoi.dung@gmail.com", "123456", OtpPurpose.REGISTER);
        verify(mail).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendDoesNotWaitForSmtp() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        JavaMailSender mail = mock(JavaMailSender.class);
        // SMTP "treo" cho tới khi test cho phép – giống Gmail chậm
        doAnswer(inv -> {
            release.await();
            return null;
        }).when(mail).send(any(SimpleMailMessage.class));

        EmailOtpSender sender = new EmailOtpSender(provider(mail), props(), "smtp.example", FROM); // executor nền mặc định
        assertTimeoutPreemptively(Duration.ofSeconds(1), () -> sender.send("nguoi.dung@gmail.com", "123456", OtpPurpose.LOGIN));

        release.countDown();
        verify(mail, timeout(2000)).send(any(SimpleMailMessage.class));
    }

    @Test
    void smtpFailureDoesNotBreakTheRequest() {
        JavaMailSender mail = mock(JavaMailSender.class);
        doThrow(new MailSendException("smtp down")).when(mail).send(any(SimpleMailMessage.class));

        inlineSender(mail).send("nguoi.dung@gmail.com", "123456", OtpPurpose.LOGIN); // không ném lỗi, chỉ log

        verify(mail).send(any(SimpleMailMessage.class));
    }

    @Test
    void reservedDomainDetection() {
        assertThat(EmailOtpSender.isReservedDomain("a@example.com")).isTrue();
        assertThat(EmailOtpSender.isReservedDomain("a@sub.example.org")).isTrue();
        assertThat(EmailOtpSender.isReservedDomain("a@myexample.com")).isFalse(); // không phải miền con của example.com
        assertThat(EmailOtpSender.isReservedDomain("a@gmail.com")).isFalse();
        assertThat(EmailOtpSender.isReservedDomain("khong-co-at")).isFalse();
    }
}
