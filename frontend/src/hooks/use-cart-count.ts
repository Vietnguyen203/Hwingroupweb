"use client";

import { useMounted } from "@/hooks/use-mounted";
import { cartCount, useCart } from "@/stores/cart";

/** Số sản phẩm trong giỏ (0 trước khi hydrate để tránh lệch HTML). */
export function useCartCount(): number {
  const mounted = useMounted();
  const count = useCart((s) => cartCount(s.lines));
  return mounted ? count : 0;
}
