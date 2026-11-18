"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, MessageCircle, ShoppingCart, UserRound } from "lucide-react";

import { useCartCount } from "@/hooks/use-cart-count";
import { useCart } from "@/stores/cart-store";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Thanh tab dưới đáy trên mobile: Trang chủ · Danh mục · Zalo · Giỏ hàng · Tài khoản. */
export function BottomNav() {
  const pathname = usePathname();
  const count = useCartCount();
  const openDrawer = useCart((s) => s.openDrawer);
  const item = (active: boolean) =>
    cn("relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition active:scale-95", active ? "font-bold text-brand" : "text-neutral-500");

  return (
    <nav aria-label="Điều hướng" className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-neutral-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(23_23_23/0.18)] backdrop-blur-xl md:hidden">
      <Link href="/" className={item(pathname === "/")}><House className="size-5" />Trang chủ</Link>
      <Link href="/categories" className={item(pathname.startsWith("/categories") || pathname.startsWith("/categories/"))}>
        <LayoutGrid className="size-5" />Danh mục
      </Link>
      <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className={item(false)}>
        <MessageCircle className="size-5" />Zalo
      </a>
      <button type="button" onClick={openDrawer} className={item(pathname === "/cart")}>
        <span className="relative">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-brand-red px-1 text-center text-[10px] leading-4 font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        Giỏ hàng
      </button>
      <Link href="/account" className={item(pathname.startsWith("/account") || pathname === "/login")}>
        <UserRound className="size-5" />Tài khoản
      </Link>
    </nav>
  );
}
