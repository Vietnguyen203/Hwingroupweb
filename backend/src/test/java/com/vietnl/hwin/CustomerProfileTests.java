package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.customer.service.CustomerService;
import com.vietnl.hwin.identity.service.UserAccountService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Hồ sơ khách xem được ngay cả khi chưa có bản ghi khách (tạo lần đầu lúc xem), kể cả tài khoản chỉ có email. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class CustomerProfileTests {

    @Autowired CustomerService customers;
    @Autowired UserAccountService users;

    @Test
    void emailOnlyAccountCanOpenProfileAndAddressesFirstTime() {
        UUID userId = users.loginByEmail(EmailAddress.of("profile.first@example.com")).getId();
        String phone = customers.profile(userId, p -> p.customer().getPhone() == null ? "none" : "has");
        assertThat(phone).isEqualTo("none");
        assertThat(customers.addresses(userId, a -> a)).isEmpty();
    }
}
