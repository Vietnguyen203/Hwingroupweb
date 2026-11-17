package com.vietnl.hwin.customer.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vietnl.hwin.customer.entity.ProductReview;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID>, JpaSpecificationExecutor<ProductReview> {

    Page<ProductReview> findByProductIdAndVisibleTrue(UUID productId, Pageable pageable);

    boolean existsByProductIdAndCustomerId(UUID productId, UUID customerId);

    /** Phân bố số sao của sản phẩm: [rating, số đánh giá]. */
    @Query("select r.rating, count(r) from ProductReview r where r.productId = :productId and r.visible = true group by r.rating")
    List<Object[]> countByRating(@Param("productId") UUID productId);
}
