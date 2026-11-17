package com.vietnl.hwin.ordering.service.model;

import com.vietnl.hwin.ordering.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.ordering.entity.Order;
import com.vietnl.hwin.ordering.entity.CancelReason;
import com.vietnl.hwin.ordering.entity.PaymentMethod;
import com.vietnl.hwin.ordering.entity.PaymentStatus;
import com.vietnl.hwin.ordering.entity.OrderStatus;
import com.vietnl.hwin.ordering.repository.OrderRepository;
import com.vietnl.hwin.ordering.service.integration.ShippingProvider;

/**
 * @param q mã đơn (một phần) hoặc SĐT người nhận
 */
public record OrderFilter(OrderStatus status, PaymentMethod paymentMethod, PaymentStatus paymentStatus,
                          String q, Instant from, Instant to, int page, int size) {
}
