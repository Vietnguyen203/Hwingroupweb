package com.vietnl.hwin.ordering.service;

import java.util.UUID;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.ordering.entity.OrderItem;
import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Service công bố cho module khác đọc dữ liệu đơn (customer dùng cho "Mua lại").
 * Không trả entity ra ngoài module.
 */
@Service
@NamedInterface("services")
public class OrderQueryService {

    private final OrderRepository orders;

    public OrderQueryService(OrderRepository orders) {
        this.orders = orders;
    }

    /** Khách đã nhận sản phẩm này (đơn đã giao / hoàn tất) – điều kiện để được đánh giá. */
    @Transactional(readOnly = true)
    public boolean hasReceivedProduct(UUID customerId, UUID productId) {
        return orders.hasReceivedProduct(customerId, productId);
    }

    /**
     * Sản phẩm + số lượng của một đơn – CHỈ khi đơn thuộc khách {@code customerId} (chống IDOR).
     *
     * @return productId -> số lượng; empty nếu không tìm thấy hoặc không phải đơn của khách
     */
    @Transactional(readOnly = true)
    public Optional<Map<UUID, Integer>> findItemsForCustomer(String orderCode, UUID customerId) {
        return orders.findByOrderCodeAndCustomerId(orderCode, customerId).map(o -> {
            Map<UUID, Integer> map = new LinkedHashMap<>();
            for (OrderItem i : o.getItems()) {
                map.merge(i.getProductId(), i.getQuantity(), Integer::sum);
            }
            return map;
        });
    }
}
