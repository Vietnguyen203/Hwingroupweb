import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import type { ProductCardResponse } from "@/lib/types";

/** Khối "Đang giảm giá": một mảng đỏ phẳng nổi bật nhất trang; mobile trượt ngang, desktop lưới 6 cột. */
export function SaleStrip({ products }: { products: ProductCardResponse[] }) {
  if (products.length === 0) return null;
  return (
    <section id="on-sale" className="scroll-mt-sticky mx-3 mt-10 rounded-2xl bg-brand-red p-3 md:mx-0 md:p-6">
      <div className="flex items-baseline justify-between gap-4 px-1 pb-3 text-white md:pb-5">
        <h2 className="text-xl font-bold md:text-3xl">Đang giảm giá</h2>
        <Link href="/search?sort=PRICE_ASC" className="text-sm font-semibold underline underline-offset-4 transition hover:text-brand-honey">
          Xem tất cả
        </Link>
      </div>
      <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-3 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-1 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-48 md:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
