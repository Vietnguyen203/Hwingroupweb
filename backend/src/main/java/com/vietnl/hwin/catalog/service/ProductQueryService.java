package com.vietnl.hwin.catalog.service;

import java.util.UUID;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.repository.ProductRepository;

/**
 * Service công bố cho module khác lấy giá, tên, tồn kho. Không trả entity ra ngoài module.
 */
@Service
@NamedInterface("query")
public class ProductQueryService {

    private final ProductRepository products;

    public ProductQueryService(ProductRepository products) {
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<ProductSnapshot> findSnapshots(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return products.findAllByIdIn(ids).stream().map(ProductQueryService::toSnapshot).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ProductSnapshot> findSnapshot(UUID id) {
        return products.findById(id).map(ProductQueryService::toSnapshot);
    }

    private static ProductSnapshot toSnapshot(Product p) {
        return new ProductSnapshot(p.getId(), p.getName(), p.getSlug(), p.mainImageUrl(), p.getPrice().amount(),
                p.getStock(), p.isActive());
    }
}
