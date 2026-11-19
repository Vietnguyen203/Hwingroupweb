package com.vietnl.hwin.catalog.service.model;

import com.vietnl.hwin.catalog.entity.ProductSort;

/**
 * Điều kiện tìm sản phẩm.
 *
 * @param q            từ khóa (có dấu hoặc không dấu)
 * @param categorySlug lọc theo danh mục
 * @param onlyActive   true cho web khách; admin có thể xem cả sản phẩm ẩn
 * @param minPrice     giá khách thực trả tối thiểu (VND), null = không lọc
 * @param maxPrice     giá khách thực trả tối đa (VND), null = không lọc
 * @param inStockOnly  chỉ lấy sản phẩm còn hàng
 * @param onSaleOnly   chỉ lấy sản phẩm đang giảm giá (có giá gạch ngang cao hơn giá thực trả, hoặc đang giảm thêm %)
 */
public record ProductSearchCriteria(String q, String categorySlug, ProductSort sort, int page, int size,
                                    boolean onlyActive, Long minPrice, Long maxPrice, boolean inStockOnly,
                                    boolean onSaleOnly) {

    public ProductSearchCriteria {
        page = Math.max(page, 0);
        size = Math.clamp(size, 1, 60);
        sort = sort == null ? ProductSort.NEWEST : sort;
        // giá âm coi như không lọc; khoảng giá đảo ngược thì đổi chỗ
        minPrice = minPrice != null && minPrice < 0 ? null : minPrice;
        maxPrice = maxPrice != null && maxPrice < 0 ? null : maxPrice;
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            Long swap = minPrice;
            minPrice = maxPrice;
            maxPrice = swap;
        }
    }

    /** Không lọc giá / tồn kho / giảm giá (dùng cho admin và các nơi chỉ cần tìm theo từ khóa, danh mục). */
    public ProductSearchCriteria(String q, String categorySlug, ProductSort sort, int page, int size,
                                 boolean onlyActive) {
        this(q, categorySlug, sort, page, size, onlyActive, null, null, false, false);
    }
}
