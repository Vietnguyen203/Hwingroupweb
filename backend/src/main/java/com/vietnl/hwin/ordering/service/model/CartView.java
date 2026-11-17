package com.vietnl.hwin.ordering.service.model;

import java.util.UUID;

import java.util.List;

/**
 * Giỏ hàng đã tính giá (giá, tồn kho lấy mới từ catalog). Tiền là VND.
 *
 * @param checkoutReady true nếu mọi dòng đều mua được và giỏ không rỗng
 */
public record CartView(List<CartLineView> lines, long subtotal, long shippingFee, long total, int itemCount,
                       boolean checkoutReady) {

}
