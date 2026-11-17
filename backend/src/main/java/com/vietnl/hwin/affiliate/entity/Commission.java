package com.vietnl.hwin.affiliate.entity;

import java.util.Map;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.Money;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: hoa hồng của một đơn (tối đa 1 / đơn).
 * amount = floor((subtotal - discount) x rate) – KHÔNG tính phí ship, chỉ 1 cấp.
 * <pre>PENDING -> APPROVED (đơn đã giao + hold-days) ; PENDING -> CANCELLED (đơn hủy / trả hàng)</pre>
 */
@Entity
@Table(name = "commissions", schema = "affiliate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Commission extends AggregateRoot<Commission> {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID orderId;

    @Column(nullable = false)
    private String orderCode;

    @Column(nullable = false)
    private UUID affiliateId;

    @Column(nullable = false)
    private UUID customerId;

    @Column(nullable = false)
    private Money baseAmount;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal rate;

    @Column(nullable = false)
    private Money amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommissionStatus status;

    private Instant eligibleAt;

    private Instant approvedAt;

    private Instant cancelledAt;

    /**
     * @param subtotal tạm tính của đơn
     * @param discount giảm giá của đơn
     */
    public static Commission create(UUID orderId, String orderCode, UUID affiliateId, UUID customerId,
                                    Money subtotal, Money discount, BigDecimal rate) {
        if (rate == null || rate.signum() < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMMISSION_RATE_INVALID);
        }
        Commission c = new Commission();
        c.orderId = orderId;
        c.orderCode = orderCode;
        c.affiliateId = affiliateId;
        c.customerId = customerId;
        c.baseAmount = subtotal.minus(discount);
        c.rate = rate;
        c.amount = c.baseAmount.multiply(rate);
        c.status = CommissionStatus.PENDING;
        return c;
    }

    /** Đơn đã giao: đặt mốc được duyệt = deliveredAt + hold. Gọi lại (event phát lại) không đổi gì. */
    public void markEligible(Instant eligibleAt) {
        if (status != CommissionStatus.PENDING) {
            return;
        }
        this.eligibleAt = eligibleAt;
    }

    public boolean isDue(Instant now) {
        return status == CommissionStatus.PENDING && eligibleAt != null && !now.isBefore(eligibleAt);
    }

    /** Duyệt: chỉ khi PENDING và đã tới mốc eligibleAt. */
    public void approve(Instant now) {
        if (status != CommissionStatus.PENDING) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMMISSION_NOT_PENDING);
        }
        if (eligibleAt == null) {
            String reason = "đơn chưa giao thành công";
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMMISSION_NOT_ELIGIBLE, Map.of("reason", String.valueOf(reason)));
        }
        if (now.isBefore(eligibleAt)) {
            String reason = "chưa hết thời gian giữ hoa hồng";
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMMISSION_NOT_ELIGIBLE, Map.of("reason", String.valueOf(reason)));
        }
        this.status = CommissionStatus.APPROVED;
        this.approvedAt = now;
    }

    /**
     * Hủy khi đơn bị hủy / trả hàng. Đã hủy -> bỏ qua (idempotent).
     * Đã APPROVED -> lỗi (không xảy ra vì hạn trả hàng = thời gian giữ hoa hồng).
     *
     * @return true nếu trạng thái thay đổi
     */
    public boolean cancel(Instant now) {
        if (status == CommissionStatus.CANCELLED) {
            return false;
        }
        if (status == CommissionStatus.APPROVED) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.COMMISSION_ALREADY_APPROVED);
        }
        this.status = CommissionStatus.CANCELLED;
        this.cancelledAt = now;
        return true;
    }
}
