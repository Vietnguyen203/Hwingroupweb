"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LINE_PROBLEM, useCartQuote } from "@/hooks/use-cart-quote";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart";

/** Giỏ hàng: sửa số lượng ở local (tự đồng bộ lên server khi đã đăng nhập), giá do backend tính. */
export default function CartPage() {
  const mounted = useMounted();
  const { lines, setQuantity, remove } = useCart();
  const quote = useCartQuote(lines, mounted);
  const me = useMe();

  if (!mounted) return <div className="m-3 h-40 animate-pulse rounded-xl bg-neutral-200" />;

  if (lines.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Giỏ hàng đang trống.</p>
        <Link href="/" className="font-semibold text-brand">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  const view = quote.data;
  const byId = new Map(view?.lines.map((l) => [l.productId, l]));
  const checkoutHref = me.data ? "/checkout" : "/login?next=/checkout";

  return (
    <div className="space-y-3 p-3 md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-4 md:space-y-0 md:py-6">
      <div className="space-y-3">
        <h1 className="text-lg font-bold">Giỏ hàng ({lines.reduce((n, l) => n + l.quantity, 0)})</h1>
        {lines.map((l) => {
          const v = byId.get(l.productId);
          return (
            <div key={l.productId} className="flex gap-3 rounded-xl bg-white p-2.5 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.imageUrl ? <img src={l.imageUrl} alt="" className="size-20 rounded-lg object-cover" /> : <div className="size-20 rounded-lg bg-neutral-100" />}
              <div className="flex flex-1 flex-col">
                <Link href={`/p/${l.slug}`} className="line-clamp-2 text-sm font-medium">{l.name}</Link>
                <span className="text-sm font-bold text-brand-red">{formatVnd(v?.unitPrice ?? l.price)}</span>
                {v?.problem && (
                  <span className="text-xs text-destructive">
                    {LINE_PROBLEM[v.problem] ?? v.problem}{v.problem === "INSUFFICIENT_STOCK" ? ` (còn ${v.stock})` : ""}
                  </span>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <button className="p-1.5" aria-label="Giảm" onClick={() => setQuantity(l.productId, l.quantity - 1)}><Minus className="size-4" /></button>
                    <span className="w-8 text-center text-sm">{l.quantity}</span>
                    <button className="p-1.5" aria-label="Tăng" onClick={() => setQuantity(l.productId, l.quantity + 1)}><Plus className="size-4" /></button>
                  </div>
                  <button aria-label="Xóa" onClick={() => remove(l.productId)} className="p-1.5 text-muted-foreground"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl bg-white p-4 text-sm shadow-sm md:sticky md:top-32">
        {quote.isPending && !view ? (
          <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />
        ) : view ? (
          <>
            <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(view.subtotal)}</span></div>
            <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(view.shippingFee)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Tổng cộng</span><span className="text-brand-red">{formatVnd(view.total)}</span></div>
            {!view.checkoutReady && <p className="text-xs text-destructive">Vui lòng xử lý các sản phẩm báo lỗi trước khi thanh toán.</p>}
          </>
        ) : (
          <p className="text-destructive">Không tính được giá, vui lòng thử lại.</p>
        )}
        <Link
          href={checkoutHref}
          aria-disabled={!view?.checkoutReady}
          className={cn(buttonVariants(), "mt-2 h-12 w-full text-base", !view?.checkoutReady && "pointer-events-none opacity-50")}
        >
          {me.data ? "Thanh toán" : "Đăng nhập để thanh toán"}
        </Link>
      </div>
    </div>
  );
}
