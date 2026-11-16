package com.vietnl.hwin.ordering.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.ProductSnapshot;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.Money;
import com.vietnl.hwin.ordering.entity.OrderLine;
import com.vietnl.hwin.ordering.service.integration.ShippingProvider;

/**
 * Tính giá giỏ hàng ở backend từ dữ liệu catalog hiện tại – không bao giờ tin giá client gửi lên.
 */
@Component
public class CartPricing {

    private final ProductQueryService products;
    private final ShippingProvider shipping;

    public CartPricing(ProductQueryService products, ShippingProvider shipping) {
        this.products = products;
        this.shipping = shipping;
    }

    /** @param quantities productId -> số lượng, giữ thứ tự hiển thị */
    public CartView price(Map<Long, Integer> quantities) {
        Map<Long, ProductSnapshot> snapshots = snapshots(quantities);
        List<CartView.Line> lines = new ArrayList<>();
        Money subtotal = Money.ZERO;
        int count = 0;
        for (var e : quantities.entrySet()) {
            ProductSnapshot p = snapshots.get(e.getKey());
            int qty = e.getValue();
            if (p == null) {
                lines.add(new CartView.Line(e.getKey(), null, "Sản phẩm không còn tồn tại", null, 0, qty, 0, 0, "NOT_FOUND"));
                continue;
            }
            String problem = !p.active() ? "INACTIVE" : p.stock() <= 0 ? "OUT_OF_STOCK"
                    : p.stock() < qty ? "INSUFFICIENT_STOCK" : null;
            Money lineTotal = Money.of(p.price()).times(qty);
            lines.add(new CartView.Line(p.id(), p.slug(), p.name(), p.imageUrl(), p.price(), qty, lineTotal.amount(),
                    p.stock(), problem));
            if (problem == null) {
                subtotal = subtotal.plus(lineTotal);
                count += qty;
            }
        }
        Money fee = shipping.quoteFee(subtotal, null);
        boolean ready = !lines.isEmpty() && lines.stream().allMatch(CartView.Line::available);
        return new CartView(lines, subtotal.amount(), fee.amount(), subtotal.plus(fee).amount(), count, ready);
    }

    /**
     * Chuyển giỏ thành các dòng đặt hàng với giá hiện tại. Dòng nào không mua được -> ném lỗi kèm chi tiết.
     */
    public List<OrderLine> toOrderLines(Map<Long, Integer> quantities) {
        CartView view = price(quantities);
        List<CartView.Line> problems = view.lines().stream().filter(l -> !l.available()).toList();
        if (view.lines().isEmpty()) {
            throw new com.vietnl.hwin.common.exception.DomainException("CART_EMPTY", "Giỏ hàng đang trống");
        }
        if (!problems.isEmpty()) {
            throw new com.vietnl.hwin.common.exception.DomainException("CART_INVALID",
                    "Một số sản phẩm trong giỏ đã hết hàng hoặc ngừng bán")
                    .withDetail("problems", problems.stream()
                            .map(l -> Map.of("productId", l.productId(), "name", l.name(), "problem", l.problem(),
                                    "stock", l.stock()))
                            .toList());
        }
        return view.lines().stream()
                .map(l -> new OrderLine(l.productId(), l.name(), l.slug(), l.imageUrl(), Money.of(l.unitPrice()),
                        l.quantity()))
                .toList();
    }

    public Money shippingFee(Money subtotal, Address address) {
        return shipping.quoteFee(subtotal, address);
    }

    private Map<Long, ProductSnapshot> snapshots(Map<Long, Integer> quantities) {
        return products.findSnapshots(quantities.keySet()).stream()
                .collect(Collectors.toMap(ProductSnapshot::id, Function.identity()));
    }
}
