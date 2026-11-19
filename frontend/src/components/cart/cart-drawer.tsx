"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";

import { CartSuggestions } from "@/components/cart/cart-suggestions";
import { buttonVariants } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/stores/cart-store";
import { useMounted } from "@/hooks/use-mounted";
import { useCartCount } from "@/hooks/use-cart-count";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useMe } from "@/hooks/use-me";

export function CartDrawer() {
  const router = useRouter();
  const mounted = useMounted();
  const count = useCartCount();
  const me = useMe();
  const { lines, isDrawerOpen, closeDrawer, setQuantity, remove } = useCart();
  // Giá, phí ship và ngưỡng miễn phí ship luôn lấy từ backend (chỉ gọi khi giỏ đang mở)
  const quote = useCartQuote(lines, mounted && isDrawerOpen);

  // Đóng bằng phím Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Khóa cuộn body khi mở drawer
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (!mounted) return null;

  const view = quote.data;
  const byId = new Map(view?.lines.map((l) => [l.productId, l]));
  const subtotal = view?.subtotal ?? cartSubtotal(lines);
  const freeshipThreshold = view?.freeShippingThreshold ?? 0; // 0 = không có miễn phí ship
  const remainingForFreeship = Math.max(0, freeshipThreshold - subtotal);
  const progressPercent = freeshipThreshold > 0 ? Math.min(100, Math.round((subtotal / freeshipThreshold) * 100)) : 0;

  const handleCheckout = () => {
    closeDrawer();
    router.push(me.data ? "/checkout" : "/login?next=/checkout");
  };

  const handleViewCart = () => {
    closeDrawer();
    router.push("/cart");
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-3 transition-opacity duration-300 sm:p-6",
        isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!isDrawerOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      {/* Hộp thoại nổi giữa màn hình (không còn trượt từ cạnh phải) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng của bạn"
        className={cn(
          "relative flex max-h-[min(88dvh,46rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-pop transition duration-300 ease-out-expo",
          isDrawerOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-b from-brand-soft/60 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-brand" />
            <h2 className="text-base font-bold text-neutral-900">
              Giỏ hàng của bạn
            </h2>
            {count > 0 && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {count} sản phẩm
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Freeship Progress Bar – chỉ khi backend có chương trình miễn phí ship */}
        {lines.length > 0 && freeshipThreshold > 0 && (
          <div className="border-b border-neutral-100 bg-amber-50/70 px-5 py-2.5 text-xs">
            {remainingForFreeship > 0 ? (
              <p className="text-neutral-700">
                Mua thêm <strong className="text-brand-red">{formatVnd(remainingForFreeship)}</strong> để được <strong className="text-emerald-700">MIỄN PHÍ VẬN CHUYỂN</strong>
              </p>
            ) : (
              <p className="font-semibold text-emerald-700">
                🎉 Tuyệt vời! Đơn hàng của bạn đã đủ điều kiện Miễn phí vận chuyển.
              </p>
            )}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex size-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <ShoppingCart className="size-10 stroke-[1.5]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-neutral-800">
                Giỏ hàng của bạn đang trống
              </h3>
              <p className="mt-1 text-sm text-neutral-500 max-w-xs">
                Chưa có món ngon nào được chọn. Hãy cùng khám phá thực đơn đa dạng của Hwin Food nhé!
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className={cn(buttonVariants(), "mt-6 rounded-full px-6 bg-brand hover:bg-brand/90")}
              >
                Khám phá sản phẩm ngay
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {lines.map((item) => (
                <div key={item.productId} className="flex gap-3.5 py-4 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeDrawer}
                    className="relative size-18 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
                  >
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-neutral-300">
                        <ShoppingBag className="size-6" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="line-clamp-2 text-sm font-medium text-neutral-900 hover:text-brand transition-colors"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          className="shrink-0 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Xóa món này"
                          aria-label="Xóa món này"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-1 text-sm font-bold text-brand-red">
                        {formatVnd(byId.get(item.productId)?.unitPrice ?? item.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex size-7 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= 99}
                          className="flex size-7 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-neutral-500">
                        = {formatVnd((byId.get(item.productId)?.unitPrice ?? item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lines.length > 0 && <CartSuggestions variant="drawer" lines={lines} remaining={remainingForFreeship} className="mt-5 border-t border-neutral-100 pt-4" />}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="border-t border-neutral-100 bg-neutral-50/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Tạm tính ({count} món):</span>
              <span className="text-base font-bold text-brand-red">{formatVnd(subtotal)}</span>
            </div>
            {view ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Phí giao hàng:</span>
                  {view.shippingFee === 0 ? <span className="font-semibold text-emerald-600">Miễn phí</span> : <span className="font-semibold text-neutral-800">{formatVnd(view.shippingFee)}</span>}
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-2">
                  <span className="text-sm font-semibold text-neutral-800">Tổng cộng:</span>
                  <span className="text-lg font-black text-brand-red">{formatVnd(view.total)}</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-neutral-500">* Phí giao hàng được tính tại bước thanh toán.</p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCheckout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-cta text-sm font-bold text-white shadow-md shadow-brand/25 hover:bg-brand-dark transition-all active:scale-[0.98]"
              >
                Tiến hành thanh toán
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleViewCart}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
              >
                Xem chi tiết giỏ hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}