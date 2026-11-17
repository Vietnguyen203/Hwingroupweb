package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.customer.entity.ProductReview;
import com.vietnl.hwin.customer.service.ProductReviewService;
import com.vietnl.hwin.customer.service.model.ProductReviewSummary;
import com.vietnl.hwin.identity.service.UserAccountService;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.OrderAdminService;
import com.vietnl.hwin.ordering.service.PlaceOrderService;
import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;

/** Đánh giá sản phẩm: chỉ khách đã nhận hàng, mỗi sản phẩm một lần, tổng hợp số sao, tên được che. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ProductReviewTests {

    private static final Address ADDRESS = new Address("Trần Thị B", PhoneNumber.of("0987654321"),
            "TP Hồ Chí Minh", "Quận 1", "Bến Nghé", "12 Lê Lợi");

    @Autowired UserAccountService users;
    @Autowired CartService cart;
    @Autowired PlaceOrderService placeOrder;
    @Autowired OrderAdminService orderAdmin;
    @Autowired ProductSearchService search;
    @Autowired ProductReviewService reviews;

    private UUID productIdBySlug(String slug) {
        return search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 60, false), p -> p)
                .getContent().stream().filter(p -> p.getSlug().equals(slug)).findFirst().orElseThrow().getId();
    }

    private Order order(UUID userId, UUID productId) {
        cart.addItem(userId, productId, 1);
        return placeOrder.place(userId, new PlaceOrderCommand(ADDRESS, PaymentMethod.COD, null, null, UUID.randomUUID().toString()),
                null, o -> o);
    }

    @Test
    void onlyCustomersWhoReceivedTheProductCanReviewOnce() {
        UUID userId = users.loginByPhone(PhoneNumber.of("0966000001")).getId();
        UUID productId = productIdBySlug("cha-que-nuong-500g");

        // chưa mua
        assertThat(reviews.eligibility(userId, productId).canReview()).isFalse();
        assertThatThrownBy(() -> reviews.write(userId, productId, 5, "Ngon", r -> r))
                .hasFieldOrPropertyWithValue("code", "REVIEW_NOT_PURCHASED");

        // đã đặt nhưng chưa nhận hàng
        Order o = order(userId, productId);
        assertThat(reviews.eligibility(userId, productId).purchased()).isFalse();

        UUID admin = UUID.randomUUID();
        orderAdmin.confirm(o.getId(), admin, x -> x);
        orderAdmin.ship(o.getId(), admin, x -> x);
        orderAdmin.deliver(o.getId(), admin, x -> x);

        assertThat(reviews.eligibility(userId, productId).canReview()).isTrue();
        ProductReview r = reviews.write(userId, productId, 4, "  Ngon, giao nhanh  ", x -> x);
        assertThat(r.getRating()).isEqualTo(4);
        assertThat(r.getComment()).isEqualTo("Ngon, giao nhanh");

        assertThat(reviews.eligibility(userId, productId).alreadyReviewed()).isTrue();
        assertThatThrownBy(() -> reviews.write(userId, productId, 5, null, x -> x))
                .hasFieldOrPropertyWithValue("code", "REVIEW_ALREADY_EXISTS");

        ProductReviewSummary s = reviews.summary(productId);
        assertThat(s.total()).isEqualTo(1);
        assertThat(s.average()).isEqualTo(4.0);
        assertThat(s.countByRating().get(4)).isEqualTo(1L);
        assertThat(reviews.list(productId, 0, 10, x -> x).getTotalElements()).isEqualTo(1);
    }

    @Test
    void ratingMustBeBetweenOneAndFiveAndNameIsMasked() {
        assertThatThrownBy(() -> ProductReview.write(UUID.randomUUID(), UUID.randomUUID(), "A", 0, null))
                .hasFieldOrPropertyWithValue("code", "REVIEW_RATING_INVALID");
        assertThatThrownBy(() -> ProductReview.write(UUID.randomUUID(), UUID.randomUUID(), "A", 6, null))
                .hasFieldOrPropertyWithValue("code", "REVIEW_RATING_INVALID");
        assertThatThrownBy(() -> ProductReview.write(UUID.randomUUID(), UUID.randomUUID(), "A", 5, "x".repeat(1001)))
                .hasFieldOrPropertyWithValue("code", "REVIEW_COMMENT_TOO_LONG");

        assertThat(ProductReview.write(UUID.randomUUID(), UUID.randomUUID(), "Trần Văn Bình", 5, null).maskedReviewerName())
                .isEqualTo("Trần V. B.");
        assertThat(ProductReview.write(UUID.randomUUID(), UUID.randomUUID(), null, 5, null).maskedReviewerName())
                .isEqualTo("Khách hàng");
    }

    @Test
    void summaryOfProductWithoutReviewsIsEmpty() {
        ProductReviewSummary s = reviews.summary(UUID.randomUUID());
        assertThat(s.total()).isZero();
        assertThat(s.average()).isZero();
        assertThat(s.countByRating()).hasSize(5).containsEntry(5, 0L);
    }
}
