package com.vietnl.hwin.identity.service.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.config.OtpProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/** Email OTP: tên miền dành riêng (example.com, .test...) không bao giờ gửi thật; địa chỉ thật vẫn gửi. */
class EmailOtpSenderTest {

    @SuppressWarnings("unchecked")
    private static EmailOtpSender sender(JavaMailSender mail) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mail);
        OtpProperties props = new OtpProperties(Duration.ofMinutes(5), 5, Duration.ofMinutes(15), 5, 50, Duration.ofMinutes(10), "pepper", true);
        return new EmailOtpSender(provider, props, "smtp.example", "Hwin Food <no-reply@hwin.vn>");
    }

    @Test
    void reservedDomainsAreNeverSent() {
        JavaMailSender mail = mock(JavaMailSender.class);
        EmailOtpSender sender = sender(mail);
        for (String to : new String[]{"khach123@example.com", "a@EXAMPLE.org", "b@mail.example.net", "c@nha.test", "d@x.invalid", "e@host.localhost"}) {
            sender.send(to, "123456", OtpPurpose.REGISTER);
        }
        verify(mail, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void realAddressesAreStillSent() {
        JavaMailSender mail = mock(JavaMailSender.class);
        sender(mail).send("nguoi.dung@gmail.com", "123456", OtpPurpose.REGISTER);
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
