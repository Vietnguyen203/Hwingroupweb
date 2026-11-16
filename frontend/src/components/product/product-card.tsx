import Link from "next/link";

import type { ProductCard as ProductCardType } from "@/lib/types";
import { AddToCartButton } from "./add-to-cart-button";
import { Price } from "./price";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      <Link href={`/p/${product.slug}`} className="relative block aspect-square bg-neutral-100">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover" />
        )}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-brand px-1.5 py-0.5 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
        {product.bestseller && (
          <span className="absolute top-2 right-2 rounded-md bg-brand-accent px-1.5 py-0.5 text-[10px] font-bold">
            BÁN CHẠY
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <Link href={`/p/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-medium leading-5">
          {product.name}
        </Link>
        {product.unit && <span className="text-xs text-muted-foreground">{product.unit}</span>}
        <div className="mt-auto pt-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
        <AddToCartButton
          disabled={!product.inStock}
          product={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return <p className="px-4 py-10 text-center text-muted-foreground">Không có sản phẩm phù hợp.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/5] animate-pulse rounded-xl bg-neutral-200" />
      ))}
    </div>
  );
}
