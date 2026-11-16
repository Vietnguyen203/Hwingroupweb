"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartCount } from "@/hooks/use-cart-count";

/** Icon giỏ hàng trên header kèm số lượng. */
export function CartButton() {
  const count = useCartCount();
  return (
    <Link href="/cart" aria-label="Giỏ hàng" className="relative inline-flex size-10 shrink-0 items-center justify-center text-neutral-800">
      <ShoppingCart className="size-6" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0 min-w-[18px] rounded-full bg-brand-red px-1 text-center text-[11px] leading-[18px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
