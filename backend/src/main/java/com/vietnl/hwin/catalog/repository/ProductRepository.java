package com.vietnl.hwin.catalog.repository;

import java.util.UUID;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.vietnl.hwin.catalog.entity.Product;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = "images")
    Optional<Product> findBySlugAndActiveTrue(String slug);

    @EntityGraph(attributePaths = "images")
    List<Product> findAllByIdIn(Collection<UUID> ids);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    long countByCategoryIdAndActiveTrue(UUID categoryId);

    /** Số sản phẩm đang bán theo danh mục: [categoryId, số lượng]. Sản phẩm chưa phân loại có categoryId null. */
    @org.springframework.data.jpa.repository.Query("select p.categoryId, count(p) from Product p where p.active = true group by p.categoryId")
    List<Object[]> countActiveByCategory();
}
