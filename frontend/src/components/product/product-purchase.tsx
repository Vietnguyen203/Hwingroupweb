"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart, Zap } from "lucide-react";

import { AffiliateProductTools } from "@/components/affiliate/affiliate-product-tools";
import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/stores/cart-store";

const MAX_QTY = 99;

/**
 * Khối mua hàng: chọn số lượng (không vượt tồn kho) + "Mua ngay" (thêm vào giỏ rồi sang giỏ hàng) + "Thêm vào giỏ".
 * CTV đã duyệt thấy thêm hoa hồng dự kiến + nút chép link chia sẻ.
 */
export function ProductPurchase({ product, stock, slug }: { product: Omit<CartLine, "quantity">; stock: number; slug: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const max = Math.min(stock, MAX_QTY);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock <= 0) {
    return <Button disabled variant="secondary" className="h-12 w-full rounded-full text-base">Hết hàng</Button>;
  }

  const addToCart = () => {
    add(product, qty);
    window.dispatchEvent(new CustomEvent("hwin:cart-added"));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-muted-foreground">Số lượng</span>
        <div className="flex h-11 items-center rounded-full border bg-white">
          <button type="button" aria-label="Giảm" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 disabled:opacity-40">
            <Minus className="size-4" />
          </button>
          <input
            inputMode="numeric"
            aria-label="Số lượng"
            value={qty}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""));
              setQty(Math.min(max, Math.max(1, n || 1)));
            }}
            className="w-10 bg-transparent text-center font-semibold outline-none"
          />
          <button type="button" aria-label="Tăng" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))} className="px-3 disabled:opacity-40">
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">Còn {stock} sản phẩm</span>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 rounded-full border-brand-cta text-base text-brand-cta hover:bg-red-50"
          onClick={() => {
            addToCart();
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          {added ? <Check /> : <ShoppingCart />}
          {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-full bg-brand-cta text-base text-white hover:brightness-110"
          onClick={() => {
            addToCart();
            router.push("/gio-hang");
          }}
        >
          <Zap /> Mua ngay
        </Button>
      </div>

      <AffiliateProductTools slug={slug} price={product.price} variant="detail" />
    </div>
  );
}
