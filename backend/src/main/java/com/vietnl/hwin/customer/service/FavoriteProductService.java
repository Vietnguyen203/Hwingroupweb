package com.vietnl.hwin.customer.service;

import java.util.UUID;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.ProductSnapshot;
import com.vietnl.hwin.customer.entity.CustomerProductStat;
import com.vietnl.hwin.customer.repository.CustomerProductStatRepository;

/** "Sản phẩm bạn hay mua": top sản phẩm theo tổng số lượng đã mua, chỉ hiện sản phẩm còn bán. */
@Service
public class FavoriteProductService {

    private final CustomerProductStatRepository productStats;
    private final ProductQueryService products;

    public FavoriteProductService(CustomerProductStatRepository productStats, ProductQueryService products) {
        this.productStats = productStats;
        this.products = products;
    }

    public record Favorite(ProductSnapshot product, int totalQuantity, int orderCount) {
    }

    @Transactional(readOnly = true)
    public List<Favorite> top(UUID customerId, int limit) {
        List<CustomerProductStat> stats = productStats.findTop(customerId, PageRequest.of(0, Math.clamp(limit, 1, 20) * 2));
        Map<UUID, ProductSnapshot> snapshots = products.findSnapshots(
                        stats.stream().map(s -> s.getId().productId()).toList()).stream()
                .collect(Collectors.toMap(ProductSnapshot::id, Function.identity()));
        return stats.stream()
                .filter(s -> snapshots.containsKey(s.getId().productId()) && snapshots.get(s.getId().productId()).active())
                .limit(Math.clamp(limit, 1, 20))
                .map(s -> new Favorite(snapshots.get(s.getId().productId()), s.getTotalQuantity(), s.getOrderCount()))
                .toList();
    }
}
