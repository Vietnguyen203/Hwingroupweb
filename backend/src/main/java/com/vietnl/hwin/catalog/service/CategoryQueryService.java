package com.vietnl.hwin.catalog.service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.entity.Category;
import com.vietnl.hwin.catalog.repository.CategoryRepository;
import com.vietnl.hwin.catalog.service.model.CategorySnapshot;

/** Service công bố cho module khác tra cứu danh mục. Không trả entity ra ngoài module. */
@Service
@NamedInterface("query")
public class CategoryQueryService {

    private final CategoryRepository categories;

    public CategoryQueryService(CategoryRepository categories) {
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public List<CategorySnapshot> findSnapshots(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return categories.findAllById(ids).stream().map(CategoryQueryService::toSnapshot).toList();
    }

    @Transactional(readOnly = true)
    public Optional<CategorySnapshot> findBySlug(String slug) {
        return categories.findBySlug(slug).filter(Category::isActive).map(CategoryQueryService::toSnapshot);
    }

    private static CategorySnapshot toSnapshot(Category c) {
        return new CategorySnapshot(c.getId(), c.getName(), c.getSlug());
    }
}
