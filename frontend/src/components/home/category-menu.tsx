import Link from "next/link";

import type { CategoryResponse } from "@/lib/types";

/**
 * Danh mục: mobile = icon tròn 4 cột (cuộn dọc); desktop = thẻ trắng bo lớn, ảnh tròn gradient tím,
 * rê chuột thẻ nổi lên và ảnh phóng nhẹ.
 */
export function CategoryMenu({ categories }: { categories: CategoryResponse[] }) {
  if (!categories || categories.length === 0) return null;
  return (
    <nav aria-label="Danh mục" className="grid grid-cols-4 gap-x-2 gap-y-4 px-3 sm:grid-cols-6 md:flex md:flex-wrap md:justify-center md:gap-5 md:px-0">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.slug}`}
          className="group/cat flex flex-col items-center gap-1.5 text-center md:w-[calc((100%-6.25rem)/6)] md:min-w-40 md:gap-3 md:rounded-3xl md:bg-white md:px-3 md:py-6 md:shadow-card md:ring-1 md:ring-black/[0.04] md:transition md:duration-300 md:ease-out-expo md:hover:-translate-y-1.5 md:hover:shadow-card-hover"
        >
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-brand-soft transition duration-300 ease-spring group-hover/cat:scale-105 md:size-28 md:bg-gradient-to-b md:from-brand md:to-brand-dark md:p-3 md:shadow-[0_10px_20px_-8px_rgb(108_59_255/0.6)]">
            {c.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.iconUrl} alt="" className="size-full object-contain transition duration-300 group-hover/cat:scale-110" />
            )}
          </span>
          <span className="text-[13px] leading-4 font-medium text-neutral-800 transition-colors group-hover/cat:text-brand md:text-sm md:font-extrabold md:tracking-wide md:text-neutral-900 md:uppercase">{c.name}</span>
          {c.productCount > 0 && <span className="hidden rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand md:block">{c.productCount} sản phẩm</span>}
        </Link>
      ))}
    </nav>
  );
}
