import Link from "next/link";

import type { ProductCardResponse as ProductCardType } from "@/lib/types";
import { AddToCartButton } from "./add-to-cart-button";
import { Price } from "./price";

/** Thẻ sản phẩm: ảnh vuông, nhãn -x% đỏ, tên 2 dòng, giá gạch + giá đỏ, nút giỏ tròn. */
export function ProductCardResponse({ product }: { product: ProductCardType }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <Link href={`/san-pham/${product.slug}`} className="relative block aspect-square bg-neutral-100">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover" />
        )}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-brand-red px-1.5 py-0.5 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
        {product.bestseller && (
          <span className="absolute bottom-2 left-2 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold text-white">
            Bán chạy
          </span>
        )}
        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold text-neutral-700">Hết hàng</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <Link href={`/san-pham/${product.slug}`} className="line-clamp-2 min-h-10 text-sm leading-5 font-medium text-neutral-900 uppercase">
          {product.name}
        </Link>
        {product.unit && <span className="mt-0.5 text-xs text-muted-foreground">{product.unit}</span>}
        <div className="mt-auto flex items-end justify-between gap-1 pt-1.5">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <AddToCartButton
            disabled={!product.inStock}
            product={{ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }}
          />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return <p className="px-4 py-10 text-center text-muted-foreground">Không có sản phẩm phù hợp.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 px-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:px-0 lg:grid-cols-5">
      {products.map((p) => (
        <ProductCardResponse key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:px-0 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/5] animate-pulse rounded-xl bg-neutral-200" />
      ))}
    </div>
  );
}
