package com.vietnl.hwin.ordering.api;

import org.springframework.http.ResponseEntity;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
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

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.ordering.api.requests.AdminCancelRequest;
import com.vietnl.hwin.ordering.api.responses.AdminOrderResponse;
import com.vietnl.hwin.ordering.api.responses.AdminOrderRow;
import com.vietnl.hwin.ordering.api.requests.MarkPaidRequest;
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
    public ResponseEntity<PageResponse<AdminOrderRow>> list(@RequestParam(required = false) OrderStatus status,
                                            @RequestParam(required = false) PaymentMethod paymentMethod,
                                            @RequestParam(required = false) PaymentStatus paymentStatus,
                                            @RequestParam(required = false) String q,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                            @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                            @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        var filter = new OrderFilter(status, paymentMethod, paymentStatus, q, from, to, page, size);
        return ResponseEntity.ok(PageResponse.of(service.search(filter, mapper::toRow), x -> x));
    }

    /**
     * Chạy ngay job hủy đơn chuyển khoản quá hạn. {@code asOf} (giả lập thời điểm) chỉ dùng được khi
     * hwin.ordering.simulated-time-enabled=true (profile dev).
     */
    @PostMapping("/run-payment-timeout-job")
    public ResponseEntity<Map<String, Object>> runPaymentTimeoutJob(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant asOf) {
        if (asOf != null && !props.simulatedTimeEnabled()) {
            throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.SIMULATED_TIME_DISABLED);
        }
        Instant when = asOf != null ? asOf : Instant.now();
        return ResponseEntity.ok(Map.of("asOf", when.toString(), "cancelled", paymentTimeoutJob.cancelOverdue(when)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.get(id, this::admin));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<AdminOrderResponse> markPaid(@PathVariable UUID id, @Valid @RequestBody MarkPaidRequest r,
                                       @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.markPaid(id, r.getPaymentRef(), me.userId(), this::admin));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<AdminOrderResponse> confirm(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.confirm(id, me.userId(), this::admin));
    }

    @PostMapping("/{id}/ship")
    public ResponseEntity<AdminOrderResponse> ship(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.ship(id, me.userId(), this::admin));
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<AdminOrderResponse> deliver(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.deliver(id, me.userId(), this::admin));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<AdminOrderResponse> returnOrder(@PathVariable UUID id, @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.returnOrder(id, me.userId(), this::admin));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AdminOrderResponse> cancel(@PathVariable UUID id, @Valid @RequestBody(required = false) AdminCancelRequest r,
                                     @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(service.cancel(id, r == null ? null : r.getReason(), me.userId(), this::admin));
    }

    private AdminOrderResponse admin(Order o) {
        return mapper.toAdmin(o, paymentGateway.instructionFor(o.getOrderCode(), o.getTotal(), o.getPaymentMethod()));
    }
}
