"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { useCartCount } from "@/hooks/use-cart-count";
import { useCart } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

/** Icon giỏ hàng trên header: bấm vào mở Cart Drawer trượt từ phải sang. */
export function CartButton() {
  const count = useCartCount();
  const openDrawer = useCart((s) => s.openDrawer);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    const handleCartAdded = () => {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("hwin:cart-added", handleCartAdded);
    return () => window.removeEventListener("hwin:cart-added", handleCartAdded);
  }, []);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Giỏ hàng"
      className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-all hover:bg-neutral-100 hover:scale-105 active:scale-95"
    >
      <ShoppingCart className={cn("size-6 transition-transform", bouncing && "scale-115 text-brand")} />
      {count > 0 && (
        <span
          className={cn(
            "absolute top-0 right-0 min-w-[18px] rounded-full bg-brand-red px-1 text-center text-[11px] leading-[18px] font-bold text-white shadow-sm transition-transform",
            bouncing && "animate-cart-pop bg-red-600 scale-125"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
