import Link from "next/link";
import { Flame, SearchX } from "lucide-react";

import { AffiliateProductTools } from "@/components/affiliate/affiliate-product-tools";
import { EmptyState, emptyStateButton } from "@/components/ui/empty-state";
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_12px_28px_rgba(36,60,132,0.14)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-neutral-50">
        {/* Dải sáng Shimmer sweep khi hover */}
        <div className="pointer-events-none absolute inset-0 z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

        {/* Badge giảm giá nổi bật góc trên ảnh */}
        {product.discountPercent > 0 && (
          <span className="animate-pulse-subtle absolute top-2 left-2 z-20 flex items-center rounded-lg bg-gradient-to-r from-red-600 to-amber-500 px-2 py-0.5 text-[11px] font-black tracking-wide text-white shadow-md">
            -{product.discountPercent}%
          </span>
        )}

        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />
        )}
        {!product.inStock && (
          <span className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[1px] text-sm font-bold text-neutral-600">
            Hết hàng
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-neutral-800 uppercase transition-colors duration-200 group-hover:text-brand"
        >
          {product.name}
        </Link>
        {product.unit && <span className="mt-0.5 text-xs text-muted-foreground">{product.unit}</span>}
        <div className="mt-1 flex min-h-4 items-center gap-1.5 text-xs">
          {hasCompare && <span className="text-neutral-400 line-through">{formatVnd(product.compareAtPrice!)}</span>}
        </div>
        <span className="text-lg font-black tracking-tight text-brand-red md:text-xl drop-shadow-[0_1px_1px_rgba(230,46,4,0.1)]">
          {formatVnd(product.price)}
        </span>
        {product.salePercent > 0 && (
          <span className="mt-0.5 w-fit rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-red">
            Giảm thêm {product.salePercent}%
          </span>
        )}
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          {product.bestseller ? (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-orange-500/20">
              <Flame className="size-3 fill-white text-white" /> Bán chạy
            </span>
          ) : (
            <span className="invisible text-[11px]">Ẩn</span>
          )}
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
