import Link from "next/link";
import { Zap } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import type { ProductCardResponse } from "@/lib/types";

/** Khối "Đang giảm giá" kiểu Flash Sale: nền gradient cam đỏ; mobile trượt ngang, desktop lưới 6 cột. */
export function SaleStrip({ products }: { products: ProductCardResponse[] }) {
  if (products.length === 0) return null;
  return (
    <section className="relative mx-3 mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#b42a05] via-brand-red to-brand-accent p-3 shadow-[0_18px_40px_-14px_rgb(214_54_10/0.55)] md:mx-0 md:p-6">
      <span aria-hidden className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl" />
      <div className="relative flex items-center justify-between px-1 pb-3 text-white md:pb-5">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight uppercase md:text-3xl">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur md:size-11">
            <Zap className="size-5 animate-pulse fill-[#ffd400] text-[#ffd400] md:size-6" />
          </span>
          Đang giảm giá
          <span className="ml-1 hidden rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold tracking-normal normal-case ring-1 ring-white/25 backdrop-blur-xs sm:inline-block">
            Giới hạn thời gian
          </span>
        </h2>
        <Link href="/search?sort=PRICE_ASC" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand-red shadow transition hover:scale-105 hover:shadow-lg active:scale-95">
          Xem tất cả ›
        </Link>
      </div>
      <div className="no-scrollbar relative -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-3 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-1 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-48 md:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
