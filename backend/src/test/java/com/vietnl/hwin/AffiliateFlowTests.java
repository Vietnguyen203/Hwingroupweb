package com.vietnl.hwin;

import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.affiliate.repository.CustomerBindingRepository;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.affiliate.service.job.CommissionApprovalJob;
import com.vietnl.hwin.affiliate.service.PayoutService;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.identity.service.UserQueryService;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.OrderAdminService;
import com.vietnl.hwin.ordering.service.PlaceOrderService;
import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;

/**
 * Test tích hợp luồng CTV xuyên module (Postgres/Redis thật):
 * đăng ký -> duyệt (cấp vai trò) -> khách đặt qua ref -> gắn khách vĩnh viễn -> hoa hồng PENDING
 * -> giao -> job duyệt sau 7 ngày -> rút tiền; chặn tự giới thiệu; hủy đơn hủy hoa hồng.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class AffiliateFlowTests {

    @Autowired UserAccountService users;
    @Autowired UserQueryService userQuery;
    @Autowired AffiliateService affiliateService;
    @Autowired AffiliateAdminService affiliateAdmin;
    @Autowired AffiliateRepository affiliates;
    @Autowired CommissionRepository commissions;
    @Autowired CustomerBindingRepository bindings;
    @Autowired CommissionApprovalJob approvalJob;
    @Autowired PayoutService payouts;
    @Autowired CartService cart;
    @Autowired PlaceOrderService placeOrder;
    @Autowired OrderAdminService orderAdmin;
    @Autowired ProductSearchService search;

    private static final UUID ADMIN = UUID.randomUUID();
    /** Ảnh JPEG tối thiểu (chỉ cần đúng chữ ký file). */
    private static final byte[] FAKE_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0};

    private Affiliate approvedAffiliate(String phone) {
        UUID userId = users.loginByPhone(PhoneNumber.of(phone)).getId();
        String front = affiliateService.uploadIdCard(userId, new java.io.ByteArrayInputStream(FAKE_JPEG), FAKE_JPEG.length, "image/jpeg");
        String back = affiliateService.uploadIdCard(userId, new java.io.ByteArrayInputStream(FAKE_JPEG), FAKE_JPEG.length, "image/jpeg");
        UUID id = affiliateService.register(userId, "CTV " + phone, "https://fb.com/ctv", null, null, front, back, Affiliate::getId);
        affiliateAdmin.approve(id, ADMIN, a -> a);
        return affiliates.findById(id).orElseThrow();
    }

    private Order order(UUID customerId, String ref, String slug, int qty) {
        cart.addItem(customerId, productId(slug), qty);
        Address address = new Address("Khách", userQuery.findPhone(customerId).orElseThrow(), "HN", "CG", "DV", "1 XT");
        return placeOrder.place(customerId, new PlaceOrderCommand(address, PaymentMethod.COD, null, null, null), ref, o -> o);
    }

    @Test
    void fullAffiliateFlow() {
        Affiliate ctv = approvedAffiliate("0922000001");
        await(() -> userQuery.findPhone(ctv.getUserId()).isPresent(), "tài khoản CTV");
        UUID customer = users.loginByPhone(PhoneNumber.of("0922000002")).getId();

        // Đơn đầu tiên qua link CTV: 22 x 95.000 = 2.090.000 -> hoa hồng 209.000
        Order first = order(customer, ctv.getReferralCode(), "cha-lua-truyen-thong-500g", 22);
        await(() -> commissions.findByOrderId(first.getId()).isPresent(), "tạo hoa hồng");
        var c = commissions.findByOrderId(first.getId()).orElseThrow();
        assertThat(c.getAmount().amount()).isEqualTo(209_000L);
        assertThat(c.getStatus()).isEqualTo(CommissionStatus.PENDING);
        assertThat(bindings.findByCustomerId(customer)).get().extracting(b -> b.getAffiliateId()).isEqualTo(ctv.getId());

        // Giao hàng -> job duyệt: chưa đủ 7 ngày thì chưa duyệt, sau 7 ngày thì duyệt
        orderAdmin.confirm(first.getId(), ADMIN, o -> o);
        orderAdmin.ship(first.getId(), ADMIN, o -> o);
        orderAdmin.deliver(first.getId(), ADMIN, o -> o);
        await(() -> commissions.findByOrderId(first.getId()).orElseThrow().getEligibleAt() != null, "mốc duyệt");
        approvalJob.approveDue(Instant.now().plus(Duration.ofDays(6)));
        assertThat(commissions.findByOrderId(first.getId()).orElseThrow().getStatus()).isEqualTo(CommissionStatus.PENDING);
        approvalJob.approveDue(Instant.now().plus(Duration.ofDays(8)));
        assertThat(commissions.findByOrderId(first.getId()).orElseThrow().getStatus()).isEqualTo(CommissionStatus.APPROVED);
        assertThat(payouts.availableBalance(ctv.getId()).amount()).isEqualTo(209_000L);

        // Gắn vĩnh viễn: đơn sau không có ref (hoặc ref CTV khác) vẫn tính cho CTV đầu tiên
        Affiliate other = approvedAffiliate("0922000003");
        Order second = order(customer, other.getReferralCode(), "gio-thu-500g", 1);
        await(() -> commissions.findByOrderId(second.getId()).isPresent(), "hoa hồng đơn 2");
        assertThat(commissions.findByOrderId(second.getId()).orElseThrow().getAffiliateId()).isEqualTo(ctv.getId());

        // Hủy đơn -> hủy hoa hồng
        orderAdmin.cancel(second.getId(), "ADMIN", ADMIN, o -> o);
        await(() -> commissions.findByOrderId(second.getId()).orElseThrow().getStatus() == CommissionStatus.CANCELLED,
                "hủy hoa hồng");

        // Rút tiền: cần tài khoản ngân hàng; tối thiểu 200.000; không quá số dư
        assertThatThrownBy(() -> payouts.request(ctv.getUserId(), 200_000, p -> p))
                .hasFieldOrPropertyWithValue("code", "BANK_ACCOUNT_REQUIRED");
    }

    @Test
    void selfReferralCreatesNoCommission() {
        Affiliate ctv = approvedAffiliate("0922000010");
        Order own = order(ctv.getUserId(), ctv.getReferralCode(), "gio-thu-500g", 1);
        UUID other = users.loginByPhone(PhoneNumber.of("0922000011")).getId();
        Order normal = order(other, ctv.getReferralCode(), "gio-thu-500g", 1);
        await(() -> commissions.findByOrderId(normal.getId()).isPresent(), "hoa hồng đơn hợp lệ");
        assertThat(commissions.findByOrderId(own.getId())).isEmpty();
        assertThat(bindings.findByCustomerId(ctv.getUserId())).isEmpty();
    }

    @Test
    void suspendedAffiliateLinkGivesNoCommission() {
        Affiliate ctv = approvedAffiliate("0922000020");
        affiliateAdmin.suspend(ctv.getId(), "Kiểm tra", ADMIN, a -> a);
        UUID customer = users.loginByPhone(PhoneNumber.of("0922000021")).getId();
        Order o = order(customer, ctv.getReferralCode(), "gio-thu-500g", 1);
        Order marker = order(users.loginByPhone(PhoneNumber.of("0922000022")).getId(),
                approvedAffiliate("0922000023").getReferralCode(), "gio-thu-500g", 1);
        await(() -> commissions.findByOrderId(marker.getId()).isPresent(), "listener đã chạy");
        assertThat(commissions.findByOrderId(o.getId())).isEmpty();
        assertThat(bindings.findByCustomerId(customer)).isEmpty();
    }

    private UUID productId(String slug) {
        return search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 60, false), p -> p)
                .getContent().stream().filter(p -> p.getSlug().equals(slug)).findFirst().orElseThrow().getId();
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
