package com.vietnl.hwin.ordering.api;

import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;
import org.springframework.http.ResponseEntity;
import java.util.Arrays;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthCookies;
import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.ordering.api.dto.CheckoutConfigResponse;
import com.vietnl.hwin.ordering.api.dto.OrderDetailResponse;
import com.vietnl.hwin.ordering.api.dto.PlaceOrderRequest;
import com.vietnl.hwin.ordering.api.mapper.OrderMapper;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.service.config.OrderingProperties;
import com.vietnl.hwin.ordering.service.PlaceOrderService;
import com.vietnl.hwin.ordering.service.model.PlaceOrderCommand;
import com.vietnl.hwin.ordering.service.integration.PaymentGateway;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Thanh toán: cấu hình + đặt hàng từ giỏ server. */
@Tag(name = "ordering")
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    /** Cookie mã giới thiệu do API click link CTV đặt (Chặng 3). */
    static final String REF_COOKIE = "hwin_ref";

    private final PlaceOrderService placeOrderService;
    private final PaymentGateway paymentGateway;
    private final OrderingProperties props;
    private final OrderMapper mapper;

    public CheckoutController(PlaceOrderService placeOrderService, PaymentGateway paymentGateway,
                              OrderingProperties props, OrderMapper mapper) {
        this.placeOrderService = placeOrderService;
        this.paymentGateway = paymentGateway;
        this.props = props;
        this.mapper = mapper;
    }

    @GetMapping("/config")
    public ResponseEntity<CheckoutConfigResponse> config() {
        return ResponseEntity.ok(new CheckoutConfigResponse(props.shippingFee(),
                Arrays.stream(PaymentMethod.values()).map(Enum::name).toList()));
    }

    /** Đặt hàng. Giá tính lại ở backend; mã CTV đọc từ cookie hwin_ref (client không tự gửi). */
    @PostMapping("/orders")
    public ResponseEntity<OrderDetailResponse> place(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody PlaceOrderRequest r,
                                     HttpServletRequest request) {
        String ref = AuthCookies.read(request, REF_COOKIE).orElse(null);
        PlaceOrderCommand cmd = new PlaceOrderCommand(mapper.toAddress(r.getShippingAddress()), r.getPaymentMethod(),
                mapper.toVat(r.getVatInvoice()), r.getNote(), r.getIdempotencyKey());
        return ResponseEntity.status(HttpStatus.CREATED).body(placeOrderService.place(me.userId(), cmd, ref, order -> mapper.toDetail(order,
                paymentGateway.instructionFor(order.getOrderCode(), order.getTotal(), order.getPaymentMethod()))));
    }
}
