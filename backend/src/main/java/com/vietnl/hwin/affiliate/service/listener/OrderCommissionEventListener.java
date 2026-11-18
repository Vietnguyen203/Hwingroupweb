package com.vietnl.hwin.affiliate.service.listener;

import com.vietnl.hwin.affiliate.service.AttributionService;
import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.affiliate.entity.Commission;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.notification.NotificationService;
import com.vietnl.hwin.common.notification.NotificationType;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.event.OrderCancelledEvent;
import com.vietnl.hwin.ordering.entity.event.OrderDeliveredEvent;
import com.vietnl.hwin.ordering.entity.event.OrderPlacedEvent;
import com.vietnl.hwin.ordering.entity.event.OrderReturnedEvent;

/**
 * Hoa hồng theo vòng đời đơn (nghe event của ordering):
 * OrderPlacedEvent -> tạo PENDING; OrderDeliveredEvent -> đặt mốc duyệt (+hold-days); OrderCancelledEvent/Returned -> CANCELLED.
 * Idempotent: order_id UNIQUE, các method domain bỏ qua khi đã xử lý.
 */
@Component
public class OrderCommissionEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderCommissionEventListener.class);

    private final AttributionService attribution;
    private final CommissionRepository commissions;
    private final AffiliateProperties props;
    private final AuditLogger audit;
    private final NotificationService notifications;
    private final Clock clock;

    public OrderCommissionEventListener(AttributionService attribution, CommissionRepository commissions,
                                  AffiliateProperties props, AuditLogger audit, NotificationService notifications,
                                  Clock clock) {
        this.attribution = attribution;
        this.commissions = commissions;
        this.props = props;
        this.audit = audit;
        this.notifications = notifications;
        this.clock = clock;
    }

    @ApplicationModuleListener
    void on(OrderPlacedEvent e) {
        if (commissions.findByOrderId(e.orderId()).isPresent()) {
            return; // event phát lại
        }
        attribution.resolve(e.customerId(), e.referralCode(), e.orderId()).ifPresent(affiliate -> {
            Commission c = commissions.save(Commission.create(e.orderId(), e.orderCode(), affiliate.getId(),
                    e.customerId(), Money.of(e.subtotal()), Money.of(e.discount()), props.commissionRate()));
            audit.log("affiliate", "Commission", c.getId(), "COMMISSION_CREATED", null, c.getAmount().amount(),
                    "{\"orderCode\":\"" + e.orderCode() + "\",\"referralCode\":\"" + affiliate.getReferralCode() + "\"}");
            log.info("Hoa hồng {}đ cho CTV {} – đơn {}", c.getAmount().amount(), affiliate.getReferralCode(), e.orderCode());
            notifications.notifyUser(affiliate.getUserId(), NotificationType.COMMISSION_EARNED,
                    Map.of("orderCode", e.orderCode(), "amount", c.getAmount().amount()), "/affiliate",
                    "commission-earned:" + e.orderId());
        });
    }

    @ApplicationModuleListener
    void on(OrderDeliveredEvent e) {
        commissions.findByOrderId(e.orderId()).ifPresent(c -> {
            c.markEligible(e.deliveredAt().plus(props.hold()));
            commissions.save(c);
        });
    }

    @ApplicationModuleListener
    void on(OrderCancelledEvent e) {
        cancel(e.orderId(), e.orderCode());
    }

    @ApplicationModuleListener
    void on(OrderReturnedEvent e) {
        cancel(e.orderId(), e.orderCode());
    }

    private void cancel(UUID orderId, String orderCode) {
        commissions.findByOrderId(orderId).ifPresent(c -> {
            if (c.cancel(clock.instant())) {
                commissions.save(c);
                audit.log("affiliate", "Commission", c.getId(), "COMMISSION_CANCELLED", null, c.getAmount().amount(),
                        "{\"orderCode\":\"" + orderCode + "\"}");
            }
        });
    }
}
