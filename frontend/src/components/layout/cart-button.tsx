"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { useCartCount } from "@/hooks/use-cart-count";
import { useCart } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

export interface CartButtonProps {
  showLabel?: boolean;
  className?: string;
}

/** Icon giỏ hàng trên header: bấm vào mở Cart Drawer trượt từ phải sang. */
export function CartButton({ showLabel = true, className }: CartButtonProps) {
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
      className={cn(
        "group flex flex-col items-center gap-1 text-neutral-700 transition hover:text-brand cursor-pointer",
        className
      )}
    >
      <div className="relative">
        <ShoppingCart className={cn("size-6 transition-transform group-hover:scale-110", bouncing && "scale-125 text-brand")} />
        {count > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-2 min-w-[18px] rounded-full bg-brand-red px-1 text-center text-[10px] leading-[18px] font-bold text-white shadow-sm transition-transform",
              bouncing && "animate-cart-pop bg-red-600 scale-125"
            )}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
      {showLabel && <span className="text-[11px] font-medium leading-none text-neutral-600 group-hover:text-brand">Giỏ hàng</span>}
    </button>
  );
}
