import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Thẻ combo nổi bật dạng ngang (ảnh trái, thông tin + giá phải) cho khối "Combo ưu đãi" khi chỉ có 1–2 combo,
 * để không bị một thẻ nhỏ nằm lẻ loi giữa khoảng trống.
 */
export function ComboFeature({ product, className }: { product: ProductCardResponse; className?: string }) {
  const hasCompare = product.compareAtPrice != null && product.compareAtPrice > product.price;
  return (
    <article className={cn("group flex overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm transition hover:shadow-[0_12px_28px_rgba(229,50,45,0.15)]", className)}>
      <Link href={`/products/${product.slug}`} className="relative block w-[42%] shrink-0 overflow-hidden bg-neutral-50 sm:w-2/5">
        {product.discountPercent > 0 && (
          <span className="absolute top-3 left-3 z-10 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 px-2.5 py-1 text-xs font-black text-white shadow-md">
            -{product.discountPercent}%
          </span>
        )}
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend / thư mục public
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full min-h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 md:p-6">
        <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-800 uppercase">
          <Gift className="size-3.5" /> Combo ưu đãi
        </span>
        <Link href={`/products/${product.slug}`} className="text-lg leading-snug font-extrabold text-neutral-900 uppercase transition-colors group-hover:text-brand md:text-xl">
          {product.name}
        </Link>
        {product.unit && <p className="text-sm text-neutral-500">{product.unit}</p>}

        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-black text-brand-red md:text-3xl">{formatVnd(product.price)}</span>
          {hasCompare && <span className="text-sm text-neutral-400 line-through">{formatVnd(product.compareAtPrice!)}</span>}
        </div>
        {product.salePercent > 0 && (
          <span className="w-fit rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-brand-red">Đã gồm giảm thêm {product.salePercent}%</span>
        )}

        <div className="mt-2 flex items-center gap-3">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            Xem chi tiết <ArrowRight className="size-4" />
          </Link>
          <span className="ml-auto">
            <AddToCartButton
              disabled={!product.inStock}
              product={{ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }}
            />
          </span>
        </div>
      </div>
    </article>
  );
}
