"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { formatVnd } from "@/lib/format";
import { cartSubtotal, useCart } from "@/stores/cart";

/**
 * Giỏ hàng (bản Chặng 1: chỉ localStorage).
 * Chặng 2: đồng bộ giỏ server, tính giá ở backend, chuyển sang thanh toán.
 */
export default function CartPage() {
  const mounted = useMounted();
  const { lines, setQuantity, remove } = useCart();

  if (!mounted) return <div className="m-3 h-40 animate-pulse rounded-xl bg-neutral-200" />;

  if (lines.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Giỏ hàng đang trống.</p>
        <Link href="/" className="font-semibold text-brand">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <h1 className="text-lg font-bold">Giỏ hàng</h1>
      {lines.map((l) => (
        <div key={l.productId} className="flex gap-3 rounded-xl bg-white p-2.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {l.imageUrl && <img src={l.imageUrl} alt="" className="size-20 rounded-lg object-cover" />}
          <div className="flex flex-1 flex-col">
            <Link href={`/p/${l.slug}`} className="line-clamp-2 text-sm font-medium">{l.name}</Link>
            <span className="text-sm font-bold text-brand-red">{formatVnd(l.price)}</span>
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
      ))}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex justify-between text-sm"><span>Tạm tính</span><span className="font-bold">{formatVnd(cartSubtotal(lines))}</span></div>
        <p className="mt-1 text-xs text-muted-foreground">Phí ship và tổng tiền chính xác được tính ở bước thanh toán.</p>
        <Button disabled className="mt-3 h-12 w-full text-base">Thanh toán (sẽ có ở Chặng 2)</Button>
      </div>
    </div>
  );
}
