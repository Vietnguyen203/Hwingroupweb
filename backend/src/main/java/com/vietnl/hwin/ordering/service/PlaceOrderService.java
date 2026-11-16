package com.vietnl.hwin.ordering.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import com.vietnl.hwin.ordering.entity.OrderLine;
import com.vietnl.hwin.ordering.entity.VatInvoiceInfo;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Use case đặt hàng từ giỏ server.
 * Điều phối: rate limit -> chống gửi trùng (idempotency) -> lấy giỏ -> tính giá ở backend -> Order.place()
 * -> lưu -> phát OrderPlaced. Trừ kho / xóa giỏ / hoa hồng / thống kê xử lý bởi listener (transaction riêng).
 */
@Service
public class PlaceOrderService {

    private static final Logger log = LoggerFactory.getLogger(PlaceOrderService.class);
    private static final Pattern REFERRAL = Pattern.compile("^[A-Z0-9]{4,16}$");
    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);

    private final OrderRepository orders;
    private final CartService cartService;
    private final CartPricing pricing;
    private final OrderCodeGenerator codes;
    private final RateLimiter rateLimiter;
    private final StringRedisTemplate redis;
    private final ApplicationEventPublisher events;
    private final OrderingProperties props;
    private final Clock clock;

    public PlaceOrderService(OrderRepository orders, CartService cartService, CartPricing pricing,
                             OrderCodeGenerator codes, RateLimiter rateLimiter, StringRedisTemplate redis,
                             ApplicationEventPublisher events, OrderingProperties props, Clock clock) {
        this.orders = orders;
        this.cartService = cartService;
        this.pricing = pricing;
        this.codes = codes;
        this.rateLimiter = rateLimiter;
        this.redis = redis;
        this.events = events;
        this.props = props;
        this.clock = clock;
    }

    public record PlaceOrderCommand(Address shippingAddress, PaymentMethod paymentMethod, VatInvoiceInfo vatInvoice,
                                    String note, String idempotencyKey) {
    }

    /**
     * @param referralCode mã CTV đọc từ cookie hwin_ref (có thể null); affiliate sẽ kiểm tra tính hợp lệ
     * @param mapper       chuyển Order sang DTO ngay trong transaction (tránh lỗi lazy-load)
     */
    @Transactional
    public <T> T place(Long customerId, PlaceOrderCommand cmd, String referralCode, Function<Order, T> mapper) {
        String idemKey = cmd.idempotencyKey() == null || cmd.idempotencyKey().isBlank() ? null
                : "idem:order:" + customerId + ":" + cmd.idempotencyKey().trim();
        if (idemKey != null) {
            String existing = redis.opsForValue().get(idemKey);
            if (existing != null) {
                return mapper.apply(orders.findByOrderCodeAndCustomerId(existing, customerId)
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng")));
            }
        }
        rateLimiter.acquireOrThrow("rl:place-order:" + customerId, props.placeOrderLimit(), Duration.ofMinutes(10),
                "Bạn đặt hàng quá nhanh, vui lòng thử lại sau ít phút");

        Map<Long, Integer> cart = cartService.quantitiesOf(customerId);
        List<OrderLine> lines = pricing.toOrderLines(cart);
        Money subtotal = lines.stream().map(l -> l.unitPrice().times(l.quantity())).reduce(Money.ZERO, Money::plus);
        Instant now = clock.instant();

        Order order = Order.place(customerId, codes.next(), lines, pricing.shippingFee(subtotal, cmd.shippingAddress()),
                cmd.shippingAddress(), cmd.paymentMethod(), cmd.vatInvoice(), cmd.note(), normalizeRef(referralCode), now);
        order = orders.save(order);
        events.publishEvent(order.placedEvent());

        if (idemKey != null) {
            redis.opsForValue().set(idemKey, order.getOrderCode(), IDEMPOTENCY_TTL);
        }
        log.info("Đặt đơn {} – {} – khách {} – ref {}", order.getOrderCode(), order.getTotal(), customerId,
                order.getReferralCode());
        return mapper.apply(order);
    }

    private static String normalizeRef(String ref) {
        if (ref == null) {
            return null;
        }
        String r = ref.trim().toUpperCase();
        return REFERRAL.matcher(r).matches() ? r : null;
    }
}
