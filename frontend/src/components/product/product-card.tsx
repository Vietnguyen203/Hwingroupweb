import Link from "next/link";
import { Flame } from "lucide-react";

import { AffiliateProductTools } from "@/components/affiliate/affiliate-product-tools";
import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

/**
 * Thẻ sản phẩm theo kiểu hwingroup.com: ảnh vuông nền trắng, tên in hoa 2 dòng, giá gốc gạch + nhãn -x%,
 * giá đỏ, nhãn "Bán chạy" + nút giỏ tròn đỏ. CTV đã duyệt thấy thêm hoa hồng dự kiến + nút chia sẻ.
 */
export function ProductCard({ product }: { product: ProductCardResponse }) {
  const hasCompare = product.compareAtPrice != null && product.compareAtPrice > product.price;
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(36,60,132,0.15)]">
      <Link href={`/san-pham/${product.slug}`} className="relative block aspect-square bg-white">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover transition group-hover:scale-[1.03]" />
        )}
        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-neutral-700">Hết hàng</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <Link href={`/san-pham/${product.slug}`}
              className="line-clamp-2 min-h-10 text-sm leading-5 font-medium text-neutral-900 uppercase hover:text-brand">
          {product.name}
        </Link>
        {product.unit && <span className="mt-0.5 text-xs text-muted-foreground">{product.unit}</span>}
        <div className="mt-1.5 flex min-h-4 items-center gap-1.5 text-xs">
          {hasCompare && <span className="text-neutral-400 line-through">{formatVnd(product.compareAtPrice!)}</span>}
          {product.discountPercent > 0 && (
            <span className="rounded bg-[#ffd400] px-1 font-bold text-neutral-900">-{product.discountPercent}%</span>
          )}
        </div>
        <span className="text-lg font-bold text-brand-red">{formatVnd(product.price)}</span>
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            product.bestseller ? "bg-gradient-to-r from-[#ff5a1f] to-[#ff9a3d] text-white" : "invisible")}>
            <Flame className="size-3" /> Bán chạy
          </span>
          <AddToCartButton
            disabled={!product.inStock}
            product={{ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }}
          />
        </div>
        <AffiliateProductTools slug={product.slug} price={product.price} />
      </div>
    </div>
  );
}

const GRID = "grid grid-cols-2 gap-2.5 px-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:px-0 lg:grid-cols-5 xl:grid-cols-6";

export function ProductGrid({ products, className }: { products: ProductCardResponse[]; className?: string }) {
  if (products.length === 0) {
    return <p className="px-4 py-10 text-center text-muted-foreground">Không có sản phẩm phù hợp.</p>;
  }
  return (
    <div className={cn(GRID, className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/5] animate-pulse rounded-xl bg-neutral-200" />
      ))}
    </div>
  );
}
