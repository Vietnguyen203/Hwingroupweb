package com.vietnl.hwin;

import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.service.job.RefreshTokenCleanupJob;
import com.vietnl.hwin.identity.service.TokenService;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.CustomerOrderService;
import com.vietnl.hwin.ordering.service.job.OrderPaymentTimeoutJob;
import com.vietnl.hwin.ordering.service.PlaceOrderService;
import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;

/** Test các job vận hành: hủy đơn chuyển khoản quá hạn, dọn refresh token cũ. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class MaintenanceJobsTests {

    @Autowired UserAccountService users;
    @Autowired CartService cart;
    @Autowired PlaceOrderService placeOrder;
    @Autowired CustomerOrderService customerOrders;
    @Autowired OrderPaymentTimeoutJob paymentTimeoutJob;
    @Autowired ProductQueryService products;
    @Autowired ProductSearchService search;
    @Autowired TokenService tokens;
    @Autowired RefreshTokenCleanupJob tokenCleanup;
    @Autowired JdbcTemplate jdbc;

    @Test
    void unpaidBankQrOrderIsCancelledAfterTimeoutAndStockRestored() {
        UUID customer = users.loginByPhone(PhoneNumber.of("0933000001")).getId();
        UUID productId = search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 60, false), p -> p)
                .getContent().stream().filter(p -> p.getSlug().equals("nem-chua-thanh-hoa-hop-20")).findFirst()
                .orElseThrow().getId();
        int stockBefore = products.findSnapshot(productId).orElseThrow().stock();
        cart.addItem(customer, productId, 2);
        Address address = new Address("Khách", PhoneNumber.of("0933000001"), "HN", "CG", "DV", "1 XT");
        Order qr = placeOrder.place(customer, new PlaceOrderCommand(address, PaymentMethod.BANK_QR, null, null, null), null, o -> o);
        await(() -> products.findSnapshot(productId).orElseThrow().stock() == stockBefore - 2, "trừ kho");

        // Chưa quá 24 giờ -> không hủy
        paymentTimeoutJob.cancelOverdue(Instant.now().plus(Duration.ofHours(23)));
        assertThat(customerOrders.get(customer, qr.getOrderCode(), Order::getStatus)).isEqualTo(OrderStatus.PENDING);

        // Quá 24 giờ -> hủy PAYMENT_TIMEOUT, hoàn kho
        assertThat(paymentTimeoutJob.cancelOverdue(Instant.now().plus(Duration.ofHours(25)))).isGreaterThanOrEqualTo(1);
        String reason = customerOrders.get(customer, qr.getOrderCode(), o -> o.getCancelReason().name());
        assertThat(reason).isEqualTo("PAYMENT_TIMEOUT");
        await(() -> products.findSnapshot(productId).orElseThrow().stock() == stockBefore, "hoàn kho");
    }

    @Test
    void staleRefreshTokensAreDeleted() {
        UserAccount user = users.loginByPhone(PhoneNumber.of("0933000002"));
        ClientInfo client = new ClientInfo("127.0.0.1", "junit");
        String active = tokens.issue(user, client).refreshToken();
        tokens.issue(user, client);
        // giả lập 1 token đã thu hồi từ 10 ngày trước và 1 token hết hạn từ 8 ngày trước
        jdbc.update("update identity.refresh_tokens set revoked_at = now() - interval '10 days' where user_id = ? "
                + "and id = (select id from identity.refresh_tokens where user_id = ? order by id asc limit 1)", user.getId(), user.getId());
        jdbc.update("update identity.refresh_tokens set expires_at = now() - interval '8 days' where user_id = ? "
                + "and id = (select id from identity.refresh_tokens where user_id = ? order by id desc limit 1)", user.getId(), user.getId());
        int before = jdbc.queryForObject("select count(*) from identity.refresh_tokens where user_id = ?", Integer.class, user.getId());

        assertThat(tokenCleanup.run()).isGreaterThanOrEqualTo(2);
        int after = jdbc.queryForObject("select count(*) from identity.refresh_tokens where user_id = ?", Integer.class, user.getId());
        assertThat(after).isEqualTo(before - 2);
        assertThat(active).isNotBlank();
    }

    private static void await(BooleanSupplier condition, String what) {
        long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
        while (System.nanoTime() < deadline) {
            if (condition.getAsBoolean()) {
                return;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        throw new AssertionError("Hết thời gian chờ: " + what);
    }
}
