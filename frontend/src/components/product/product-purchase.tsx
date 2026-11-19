"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, RotateCcw, ShoppingCart, Snowflake, Wallet, Zap } from "lucide-react";

import { AffiliateProductTools } from "@/components/affiliate/affiliate-product-tools";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { useCart, type CartLine } from "@/stores/cart-store";

const MAX_QTY = 99;

/**
 * Khối mua hàng: chọn số lượng (không vượt tồn kho) + "Mua ngay" (thêm vào giỏ rồi sang giỏ hàng) + "Thêm vào giỏ".
 * Khi người dùng cuộn qua khối này, một thanh mua cố định hiện ở cuối màn hình (dùng đúng số lượng đã chọn).
 * Dưới nút mua: cam kết giao hàng / đổi trả; CTV thấy hoa hồng + link chia sẻ, khách khác thấy lời mời làm CTV.
 */
export function ProductPurchase({ product, stock, slug }: { product: Omit<CartLine, "quantity">; stock: number; slug: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const flyAdd = useAddToCart();
  const max = Math.min(stock, MAX_QTY);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // Hiện thanh mua cố định khi khối mua hàng đã cuộn khuất phía trên màn hình
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (stock <= 0) {
    return <Button disabled variant="secondary" className="h-12 w-full rounded-full text-base">Hết hàng</Button>;
  }

  const addToCart = () => {
    add(product, qty);
    window.dispatchEvent(new CustomEvent("hwin:cart-added"));
  };
  const onAdd = (e: React.MouseEvent<HTMLElement>) => {
    flyAdd(product, qty, e.currentTarget); // ảnh bay vào giỏ rồi mới mở giỏ
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const onBuyNow = () => {
    addToCart();
    router.push("/cart");
  };

  return (
    <>
      <div ref={panelRef} className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-muted-foreground">Số lượng</span>
          <div className="flex h-11 items-center rounded-full border border-neutral-200 bg-white">
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
          <Button type="button" variant="outline" className="h-12 flex-1 rounded-full border-2 border-brand bg-white text-base font-bold text-brand transition hover:bg-brand-soft active:scale-[0.98]" onClick={onAdd}>
            {added ? <Check /> : <ShoppingCart />}
            {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
          </Button>
          <Button type="button" className="h-12 flex-1 rounded-full bg-brand-cta text-base font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0 active:scale-[0.98]" onClick={onBuyNow}>
            <Zap /> Mua ngay
          </Button>
          <WishlistButton productId={product.productId} name={product.name} className="size-12 shrink-0 bg-white shadow-none ring-2 ring-neutral-200 hover:ring-brand-red/40" />
        </div>

        {/* Cam kết giao hàng / đổi trả / thanh toán */}
        <ul className="grid gap-2 rounded-2xl bg-neutral-50 p-3.5 text-xs text-neutral-700 ring-1 ring-black/[0.04] sm:grid-cols-3">
          <li className="flex items-center gap-2"><Snowflake className="size-4 shrink-0 text-brand" /> Giao hàng giữ lạnh toàn quốc</li>
          <li className="flex items-center gap-2"><RotateCcw className="size-4 shrink-0 text-brand" /> Đổi trả trong 7 ngày nếu lỗi</li>
          <li className="flex items-center gap-2"><Wallet className="size-4 shrink-0 text-brand" /> COD hoặc chuyển khoản QR</li>
        </ul>

        <AffiliateProductTools slug={slug} price={product.price} variant="detail" />
      </div>

      {/* Thanh mua cố định: trên mobile nằm phía trên thanh điều hướng dưới */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-neutral-200 bg-white/95 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur md:bottom-0">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 md:gap-4">
            {product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trên thanh mua
              <img src={product.imageUrl} alt="" className="hidden size-12 shrink-0 rounded-lg border object-cover sm:block" />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-neutral-800 uppercase">{product.name}</p>
              <p className="text-sm">
                <b className="text-brand-red">{formatVnd(product.price)}</b>
                <span className="ml-2 text-xs text-muted-foreground">× {qty}</span>
              </p>
            </div>
            <Button type="button" variant="outline" className="h-10 rounded-full border-2 border-brand px-4 font-bold text-brand hover:bg-brand-soft" onClick={onAdd}>
              {added ? <Check /> : <ShoppingCart />}
              <span className="hidden sm:inline">{added ? "Đã thêm" : "Thêm vào giỏ"}</span>
            </Button>
            <Button type="button" className="h-10 rounded-full bg-brand-cta px-5 font-bold text-white hover:bg-brand-dark" onClick={onBuyNow}>
              <Zap /> Mua ngay
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
