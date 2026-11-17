import Link from "next/link";
import { Zap } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import type { ProductCardResponse } from "@/lib/types";

/** Khối "Đang giảm giá" kiểu Flash Sale: nền gradient đỏ–cam; mobile trượt ngang, desktop lưới 6 cột. */
export function SaleStrip({ products }: { products: ProductCardResponse[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-3 mt-8 rounded-2xl bg-gradient-to-r from-[#e5322d] to-[#ff7a00] p-3 md:mx-0 md:p-5">
      <div className="flex items-center justify-between px-1 pb-3 text-white md:pb-4">
        <h2 className="flex items-center gap-2 text-lg font-black uppercase italic md:text-2xl">
          <Zap className="size-6 fill-[#ffd400] text-[#ffd400]" /> Đang giảm giá
        </h2>
        <Link href="/tim-kiem?sort=PRICE_ASC" className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium hover:bg-white/25">Xem tất cả ›</Link>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((p) => (
          <div key={p.id} className="w-[44%] shrink-0 sm:w-48 md:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
