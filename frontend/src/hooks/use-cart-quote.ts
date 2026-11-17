"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { CartView } from "@/lib/cart-sync";
import type { CartLine } from "@/stores/cart-store";

/** Giá giỏ do backend tính (giá hiện tại, tồn kho, phí ship) – không tin giá lưu ở localStorage. */
export function useCartQuote(lines: CartLine[], enabled = true) {
  const items = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
  return useQuery({
    queryKey: ["cart-quote", items],
    queryFn: () => api<CartView>("/api/cart-quotes", { method: "POST", body: { items } }),
    enabled: enabled && items.length > 0,
    placeholderData: keepPreviousData,
  });
}

export const LINE_PROBLEM: Record<string, string> = {
  INACTIVE: "Sản phẩm đã ngừng bán",
  OUT_OF_STOCK: "Đã hết hàng",
  INSUFFICIENT_STOCK: "Không đủ hàng",
  NOT_FOUND: "Sản phẩm không còn tồn tại",
};
