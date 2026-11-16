package com.vietnl.hwin.ordering.service;

import java.util.List;

/**
 * Giỏ hàng đã tính giá (giá, tồn kho lấy mới từ catalog). Tiền là VND.
 *
 * @param checkoutReady true nếu mọi dòng đều mua được và giỏ không rỗng
 */
public record CartView(List<Line> lines, long subtotal, long shippingFee, long total, int itemCount,
                       boolean checkoutReady) {

    /**
     * @param problem null nếu mua được; INACTIVE (ngừng bán), OUT_OF_STOCK, INSUFFICIENT_STOCK, NOT_FOUND
     */
    public record Line(Long productId, String slug, String name, String imageUrl, long unitPrice, int quantity,
                       long lineTotal, int stock, String problem) {

        public boolean available() {
            return problem == null;
        }
    }
}
