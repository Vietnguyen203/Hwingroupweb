"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { cartCount, useCart } from "@/stores/cart";

export function CartButton() {
  const mounted = useMounted();
  const count = useCart((s) => cartCount(s.lines));
  return (
    <Link
      href="/cart"
      aria-label="Giỏ hàng"
      className="relative inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white"
    >
      <ShoppingCart className="size-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-brand-accent px-1 text-center text-xs leading-5 font-bold text-black">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
