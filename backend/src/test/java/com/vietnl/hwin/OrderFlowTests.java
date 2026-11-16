package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.UUID;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.customer.service.CustomerService;
import com.vietnl.hwin.customer.service.ReorderService;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.OrderAdminService;
import com.vietnl.hwin.ordering.service.PlaceOrderService;
import com.vietnl.hwin.ordering.service.PlaceOrderService.PlaceOrderCommand;

/**
 * Test tích hợp luồng đặt hàng qua nhiều module (Postgres/Redis thật):
 * đặt hàng -> event -> trừ kho (catalog), xóa giỏ (ordering), thống kê (customer)
 * -> admin hủy -> hoàn kho, trừ thống kê -> mua lại.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class OrderFlowTests {

    @Autowired UserAccountService users;
    @Autowired CartService cart;
    @Autowired PlaceOrderService placeOrder;
    @Autowired OrderAdminService orderAdmin;
    @Autowired ProductQueryService products;
    @Autowired ProductSearchService search;
    @Autowired CustomerService customers;
    @Autowired ReorderService reorder;

    private static final Address ADDRESS = new Address("Trần Thị B", PhoneNumber.of("0987654321"),
            "TP Hồ Chí Minh", "Quận 1", "Bến Nghé", "12 Lê Lợi");

    @Test
    void placeOrderTriggersStockCartAndStatsThenCancelRestores() {
        UUID userId = users.loginByPhone(PhoneNumber.of("0911000001")).getId();
        UUID productId = productIdBySlug("cha-lua-truyen-thong-500g");
        int stockBefore = products.findSnapshot(productId).orElseThrow().stock();

        cart.addItem(userId, productId, 2);
        Order order = placeOrder.place(userId,
                new PlaceOrderCommand(ADDRESS, PaymentMethod.COD, null, "Giao giờ hành chính", UUID.randomUUID().toString()),
                null, o -> o);
        assertThat(order.getTotal().amount()).isEqualTo(95_000L * 2 + 30_000);

        await(() -> products.findSnapshot(productId).orElseThrow().stock() == stockBefore - 2, "trừ kho");
        await(() -> cart.view(userId).lines().isEmpty(), "xóa giỏ");
        await(() -> customers.profile(userId, p -> p.stats().getTotalOrders()) == 1, "thống kê khách");

        orderAdmin.cancel(order.getId(), "ADMIN", UUID.randomUUID(), o -> o);
        await(() -> products.findSnapshot(productId).orElseThrow().stock() == stockBefore, "hoàn kho");
        await(() -> customers.profile(userId, p -> p.stats().getTotalOrders()) == 0, "trừ thống kê");

        ReorderService.Result result = reorder.reorder(userId, order.getOrderCode());
        assertThat(result.added()).singleElement().satisfies(a -> assertThat(a.quantity()).isEqualTo(2));
        assertThat(cart.view(userId).lines()).hasSize(1);
    }

    @Test
    void sameIdempotencyKeyReturnsSameOrder() {
        UUID userId = users.loginByPhone(PhoneNumber.of("0911000002")).getId();
        cart.addItem(userId, productIdBySlug("gio-thu-500g"), 1);
        String key = UUID.randomUUID().toString();
        Order first = placeOrder.place(userId, new PlaceOrderCommand(ADDRESS, PaymentMethod.BANK_QR, null, null, key), null, o -> o);
        Order second = placeOrder.place(userId, new PlaceOrderCommand(ADDRESS, PaymentMethod.BANK_QR, null, null, key), null, o -> o);
        assertThat(second.getOrderCode()).isEqualTo(first.getOrderCode());
        assertThat(first.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void cannotOrderMoreThanStock() {
        UUID userId = users.loginByPhone(PhoneNumber.of("0911000003")).getId();
        UUID productId = productIdBySlug("tom-kho-loai-1-200g");
        int stock = products.findSnapshot(productId).orElseThrow().stock();
        cart.addItem(userId, productId, Math.min(99, stock + 1));
        assertThatThrownBy(() -> placeOrder.place(userId,
                new PlaceOrderCommand(ADDRESS, PaymentMethod.COD, null, null, null), null, o -> o))
                .isInstanceOf(DomainException.class).hasFieldOrPropertyWithValue("code", "CART_INVALID");
    }

    @Test
    void reorderOfAnotherCustomersOrderIsNotFound() {
        UUID owner = users.loginByPhone(PhoneNumber.of("0911000004")).getId();
        UUID other = users.loginByPhone(PhoneNumber.of("0911000005")).getId();
        cart.addItem(owner, productIdBySlug("ruoc-cha-bong-heo-200g"), 1);
        Order order = placeOrder.place(owner, new PlaceOrderCommand(ADDRESS, PaymentMethod.COD, null, null, null), null, o -> o);
        assertThatThrownBy(() -> reorder.reorder(other, order.getOrderCode()))
                .hasFieldOrPropertyWithValue("code", "NOT_FOUND");
    }

    private UUID productIdBySlug(String slug) {
        return search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 60, false), p -> p)
                .getContent().stream().filter(p -> p.getSlug().equals(slug)).findFirst().orElseThrow().getId();
    }

    /** Chờ listener async xử lý xong (tối đa 10 giây). */
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
