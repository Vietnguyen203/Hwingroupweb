"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Flame, ImageOff, SearchX } from "lucide-react";

import { AffiliateProductTools } from "@/components/affiliate/affiliate-product-tools";
import { EmptyState, emptyStateButton } from "@/components/ui/empty-state";
import { SmartImg } from "@/components/ui/smart-img";
import { useProductDetail } from "@/hooks/use-product-detail";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { QuickViewDialog } from "./quick-view-dialog";
import { WishlistButton } from "./wishlist-button";

const ACTION_BASE = "flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm ring-1 ring-black/5 transition duration-200 hover:scale-110 hover:text-brand active:scale-95";

/**
 * Thẻ sản phẩm hiện đại, tương tác nhẹ nhàng:
 * - Rê chuột: thẻ nổi lên + đổ bóng tím, ảnh phóng nhẹ và chuyển mờ dần sang ảnh thứ hai (lấy theo nhu cầu từ API chi tiết),
 *   thanh "Xem nhanh / Thêm vào giỏ" trượt lên từ đáy ảnh. Bàn phím: focus vào bất kỳ nút nào cũng hiện thanh này.
 * - Cảm ứng (không có hover): nút "Thêm vào giỏ" và "Xem nhanh" hiện sẵn bên dưới giá, không phụ thuộc hover.
 * - Tim yêu thích luôn hiện ở góc ảnh; CTV đã duyệt thấy thêm hoa hồng dự kiến + nút chia sẻ.
 */
export function ProductCard({ product }: { product: ProductCardResponse }) {
  const [intent, setIntent] = useState(false); // đã rê chuột / focus vào thẻ -> mới tải ảnh thứ hai
  const [quickOpen, setQuickOpen] = useState(false);
  const detail = useProductDetail(product.slug, intent);
  const secondary = detail.data?.images?.find((src) => src && src !== product.imageUrl);
  const hasCompare = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const cartItem = { productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl };

  return (
    <article
      onPointerEnter={() => setIntent(true)}
      onFocusCapture={() => setIntent(true)}
      className="fx-rainbow group/card @container relative flex h-full flex-col rounded-2xl bg-white shadow-card ring-1 ring-black/[0.04] transition duration-300 ease-out-expo focus-within:shadow-card-hover hoverable:hover:-translate-y-1.5 hoverable:hover:shadow-card-hover"
    >
      {/* Ảnh */}
      <div className="fx-shimmer relative aspect-square overflow-hidden rounded-t-2xl bg-neutral-100">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0 block">
          {product.imageUrl ? (
            <SmartImg
              src={product.imageUrl}
              className="absolute inset-0 size-full object-cover transition duration-700 ease-out-expo hoverable:group-hover/card:scale-[1.06]"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-neutral-300"><ImageOff className="size-10" /></span>
          )}
          {secondary && (
            <SmartImg
              src={secondary}
              aria-hidden
              className="absolute inset-0 size-full scale-105 object-cover opacity-0 transition duration-500 ease-out-expo hoverable:group-hover/card:scale-[1.06] hoverable:group-hover/card:opacity-100"
            />
          )}
        </Link>

        {/* Nhãn */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="fx-shine rounded-lg bg-brand-red px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white shadow-sm">-{product.discountPercent}%</span>
          )}
          {product.bestseller && (
            <span className="fx-shine flex items-center gap-1 rounded-lg bg-brand-accent px-2 py-0.5 text-[11px] font-extrabold text-neutral-950 shadow-sm">
              <Flame className="size-3" /> Bán chạy
            </span>
          )}
        </div>

        <WishlistButton productId={product.id} name={product.name} className="absolute top-2.5 right-2.5 z-20" />
        {/* Cảm ứng: nút xem nhanh nằm ngay dưới tim (không có thanh hover) */}
        <button type="button" onClick={() => setQuickOpen(true)} aria-label={`Xem nhanh ${product.name}`} className={cn(ACTION_BASE, "absolute top-[3.4rem] right-2.5 z-20 size-9 bg-white/90 backdrop-blur hoverable:hidden")}>
          <Eye className="size-[18px]" />
        </button>

        {!product.inStock && (
          <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/75 text-sm font-bold text-neutral-600 backdrop-blur-[1px]">
            Hết hàng
          </span>
        )}

        {/* Thanh thao tác trượt lên khi rê chuột / focus (chỉ thiết bị có chuột) */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 hidden items-center gap-1.5 transition duration-300 ease-out-expo hoverable:flex hoverable:translate-y-[140%] hoverable:opacity-0 hoverable:group-focus-within/card:translate-y-0 hoverable:group-focus-within/card:opacity-100 hoverable:group-hover/card:translate-y-0 hoverable:group-hover/card:opacity-100">
          <button type="button" onClick={() => setQuickOpen(true)} aria-label={`Xem nhanh ${product.name}`} title="Xem nhanh" className={cn(ACTION_BASE, "size-9")}>
            <Eye className="size-[18px]" />
          </button>
          <AddToCartButton variant="pill" disabled={!product.inStock} product={cartItem} />
        </div>
      </div>

      {/* Thông tin */}
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-neutral-900 transition-colors duration-200 hover:text-brand group-hover/card:text-brand md:text-[15px]"
        >
          {product.name}
        </Link>
        {product.unit && <span className="text-xs text-neutral-500">{product.unit}</span>}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <span className="text-lg font-extrabold tracking-tight text-brand-red md:text-xl">{formatVnd(product.price)}</span>
          {hasCompare && <span className="text-xs text-neutral-400 line-through">{formatVnd(product.compareAtPrice!)}</span>}
        </div>
        {product.salePercent > 0 && (
          <span className="w-fit rounded-md bg-brand-red/10 px-1.5 py-0.5 text-[11px] font-bold text-brand-red">Giảm thêm {product.salePercent}%</span>
        )}

        {/* Cảm ứng: nút thêm giỏ luôn hiện, không cần hover */}
        <div className="mt-2 flex hoverable:hidden">
          <AddToCartButton variant="pill" disabled={!product.inStock} product={cartItem} />
        </div>

        <AffiliateProductTools slug={product.slug} price={product.price} />
      </div>

      {quickOpen && <QuickViewDialog product={product} onClose={() => setQuickOpen(false)} />}
    </article>
  );
}

const GRID = "grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 md:px-0 lg:grid-cols-5 xl:grid-cols-6";

export function ProductGrid({ products, className }: { products: ProductCardResponse[]; className?: string }) {
  const { ref, state } = useScrollReveal<HTMLDivElement>(); // thẻ trượt vào lần lượt khi cuộn tới
  if (products.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Không có sản phẩm phù hợp"
        description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm sản phẩm."
        actions={<Link href="/search" className={emptyStateButton.secondary}>Xem tất cả sản phẩm</Link>}
        className="py-10 md:py-14"
      />
    );
  }
  return (
    <div ref={ref} data-reveal={state} className={cn(GRID, "scroll-reveal", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.04]">
          <div className="aspect-square animate-pulse bg-neutral-200" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
