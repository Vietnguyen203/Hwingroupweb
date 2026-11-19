"use client";

import { useCallback } from "react";

import { flyToCart } from "@/lib/fx";
import { useCart, type CartLine } from "@/stores/cart-store";

/**
 * Thêm vào giỏ kèm hiệu ứng: thêm ngay (không mở giỏ), ảnh sản phẩm bay từ `source` tới biểu tượng giỏ,
 * xong mới mở giỏ hàng. Không có hiệu ứng (giảm chuyển động / không thấy biểu tượng giỏ) thì mở giỏ ngay.
 */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);

  return useCallback(
    (product: Omit<CartLine, "quantity">, quantity: number, source: Element | null) => {
      add(product, quantity, false);
      return flyToCart(source, product.imageUrl).then(openDrawer);
    },
    [add, openDrawer],
  );
}
