package com.vietnl.hwin.catalog.service.model;

import com.vietnl.hwin.catalog.entity.ProductSort;

/**
 * Điều kiện tìm sản phẩm.
 *
 * @param q            từ khóa (có dấu hoặc không dấu)
 * @param categorySlug lọc theo danh mục
 * @param onlyActive   true cho web khách; admin có thể xem cả sản phẩm ẩn
 */
public record ProductSearchCriteria(String q, String categorySlug, ProductSort sort, int page, int size,
                                    boolean onlyActive) {

    public ProductSearchCriteria {
        page = Math.max(page, 0);
        size = Math.clamp(size, 1, 60);
        sort = sort == null ? ProductSort.NEWEST : sort;
    }
}
