package com.vietnl.hwin.ordering.api;

import java.util.UUID;

import java.time.Instant;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AdminCancelRequest;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AdminOrderResponse;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.AdminOrderRow;
import com.vietnl.hwin.ordering.api.dto.OrderingDtos.MarkPaidRequest;
import com.vietnl.hwin.ordering.api.mapper.OrderingMapper;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentMethod;
import com.vietnl.hwin.ordering.entity.OrderEnums.PaymentStatus;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.service.OrderAdminService;
import com.vietnl.hwin.ordering.service.OrderAdminService.OrderFilter;
import com.vietnl.hwin.ordering.service.OrderPaymentTimeoutJob;
import com.vietnl.hwin.ordering.service.OrderingProperties;
import com.vietnl.hwin.ordering.service.integration.PaymentGateway;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Admin xử lý đơn hằng ngày (quyền ADMIN chặn ở SecurityConfig theo /api/admin/**). */
@Tag(name = "ordering-admin")
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderAdminService service;
    private final PaymentGateway paymentGateway;
    private final OrderingMapper mapper;
    private final OrderPaymentTimeoutJob paymentTimeoutJob;
    private final OrderingProperties props;

    public AdminOrderController(OrderAdminService service, PaymentGateway paymentGateway, OrderingMapper mapper,
                                OrderPaymentTimeoutJob paymentTimeoutJob, OrderingProperties props) {
        this.service = service;
        this.paymentGateway = paymentGateway;
        this.mapper = mapper;
        this.paymentTimeoutJob = paymentTimeoutJob;
        this.props = props;
    }

    @GetMapping
    public PageResponse<AdminOrderRow> list(@RequestParam(required = false) OrderStatus status,
                                            @RequestParam(required = false) PaymentMethod paymentMethod,
                                            @RequestParam(required = false) PaymentStatus paymentStatus,
                                            @RequestParam(required = false) String q,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        var filter = new OrderFilter(status, paymentMethod, paymentStatus, q, from, to, page, size);
        return PageResponse.of(service.search(filter, mapper::toRow), x -> x);
    }

    /**
     * Chạy ngay job hủy đơn chuyển khoản quá hạn. {@code asOf} (giả lập thời điểm) chỉ dùng được khi
     * hwin.ordering.simulated-time-enabled=true (profile dev).
     */
    @PostMapping("/run-payment-timeout-job")
    public Map<String, Object> runPaymentTimeoutJob(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {
        if (asOf != null && !props.simulatedTimeEnabled()) {
            throw new NotFoundException("Không hỗ trợ giả lập thời điểm ở môi trường này");
        }
        Instant when = asOf != null ? asOf : Instant.now();
        return Map.of("asOf", when.toString(), "cancelled", paymentTimeoutJob.cancelOverdue(when));
    }

    @GetMapping("/{id}")
    public AdminOrderResponse get(@PathVariable UUID id) {
        return service.get(id, this::admin);
    }

    @PostMapping("/{id}/mark-paid")
    public AdminOrderResponse markPaid(@PathVariable UUID id, @Valid @RequestBody MarkPaidRequest r,
                                       @AuthenticationPrincipal AuthPrincipal me) {
        return service.markPaid(id, r.paymentRef(), me.userId(), this::admin);
    }

    @PostMapping("/{id}/confirm")
    public AdminOrderResponse confirm(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return service.confirm(id, me.userId(), this::admin);
    }

    @PostMapping("/{id}/ship")
    public AdminOrderResponse ship(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return service.ship(id, me.userId(), this::admin);
    }

    @PostMapping("/{id}/deliver")
    public AdminOrderResponse deliver(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return service.deliver(id, me.userId(), this::admin);
    }

    @PostMapping("/{id}/return")
    public AdminOrderResponse returnOrder(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return service.returnOrder(id, me.userId(), this::admin);
    }

    @PostMapping("/{id}/cancel")
    public AdminOrderResponse cancel(@PathVariable UUID id, @Valid @RequestBody(required = false) AdminCancelRequest r,
                                     @AuthenticationPrincipal AuthPrincipal me) {
        return service.cancel(id, r == null ? null : r.reason(), me.userId(), this::admin);
    }

    private AdminOrderResponse admin(Order o) {
        return mapper.toAdmin(o, paymentGateway.instructionFor(o.getOrderCode(), o.getTotal(), o.getPaymentMethod()));
    }
}
