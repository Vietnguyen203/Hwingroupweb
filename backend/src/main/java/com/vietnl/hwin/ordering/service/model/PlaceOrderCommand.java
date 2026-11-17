package com.vietnl.hwin.ordering.service.model;

import com.vietnl.hwin.ordering.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;
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
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.entity.VatInvoiceInfo;
import com.vietnl.hwin.ordering.repository.OrderRepository;

public record PlaceOrderCommand(Address shippingAddress, PaymentMethod paymentMethod, VatInvoiceInfo vatInvoice,
                                String note, String idempotencyKey) {
}
