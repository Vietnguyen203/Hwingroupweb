import Link from "next/link";

import { ProductCardResponse } from "@/components/product/product-card";
import type { ProductCardResponse as ProductCardType } from "@/lib/types";

/** Khối "Đang giảm giá": nền gradient đỏ–cam, sản phẩm trượt ngang. */
export function SaleStrip({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-3 mt-6 rounded-2xl bg-gradient-to-r from-[#e5322d] to-[#ff7a00] p-3 md:mx-0">
      <div className="flex items-center justify-between px-1 pb-3 text-white">
        <h2 className="text-lg font-bold">Đang giảm giá</h2>
        <Link href="/tim-kiem?sort=PRICE_ASC" className="text-sm font-medium">Xem tất cả ›</Link>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {products.map((p) => (
          <div key={p.id} className="w-[44%] shrink-0 sm:w-48">
            <ProductCardResponse product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
