package com.vietnl.hwin.ordering.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.ordering.api.responses.OrderDetailResponse;
import com.vietnl.hwin.ordering.api.responses.OrderSummaryResponse;
import com.vietnl.hwin.ordering.api.mapper.OrderingMapper;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.service.CustomerOrderService;
import com.vietnl.hwin.ordering.service.integration.PaymentGateway;

import io.swagger.v3.oas.annotations.tags.Tag;

/** "Đơn của tôi". Không nhận customerId từ client – luôn lấy từ JWT. */
@Tag(name = "ordering")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final CustomerOrderService service;
    private final PaymentGateway paymentGateway;
    private final OrderingMapper mapper;

    public OrderController(CustomerOrderService service, PaymentGateway paymentGateway, OrderingMapper mapper) {
        this.service = service;
        this.paymentGateway = paymentGateway;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrderSummaryResponse>> list(@AuthenticationPrincipal AuthPrincipal me,
                                                   @RequestParam(required = false) OrderStatus status,
                                                   @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                   @RequestParam(name = "page_size", defaultValue = "10") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(service.list(me.userId(), status, page, size, mapper::toSummary), x -> x));
    }

    @GetMapping("/{code}")
    public ResponseEntity<OrderDetailResponse> get(@AuthenticationPrincipal AuthPrincipal me, @PathVariable String code) {
        return ResponseEntity.ok(service.get(me.userId(), code, this::detail));
    }

    @PostMapping("/{code}/cancel")
    public ResponseEntity<OrderDetailResponse> cancel(@AuthenticationPrincipal AuthPrincipal me, @PathVariable String code) {
        return ResponseEntity.ok(service.cancel(me.userId(), code, this::detail));
    }

    private OrderDetailResponse detail(Order o) {
        return mapper.toDetail(o, paymentGateway.instructionFor(o.getOrderCode(), o.getTotal(), o.getPaymentMethod()));
    }
}
