import Link from "next/link";

import type { CategoryResponse } from "@/lib/types";

/**
 * Danh mục: mobile = icon tròn 4 cột; desktop = thẻ trắng, ảnh tròn nền navy, tên in hoa (kiểu hwingroup.com).
 */
export function CategoryMenu({ categories }: { categories: CategoryResponse[] }) {
  return (
    <nav aria-label="Danh mục" className="grid grid-cols-4 gap-x-2 gap-y-4 px-3 sm:grid-cols-6 md:gap-4 md:px-0">
      {categories.map((c) => (
        <Link key={c.id} href={`/danh-muc/${c.slug}`}
              className="flex flex-col items-center gap-1.5 text-center md:gap-3 md:rounded-2xl md:bg-white md:px-3 md:py-6 md:shadow-[0_2px_10px_rgba(36,60,132,0.08)] md:transition md:hover:-translate-y-1 md:hover:shadow-[0_8px_20px_rgba(36,60,132,0.15)]">
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#e8f1fd] md:size-28 md:bg-gradient-to-b md:from-[#2f4fa8] md:to-brand md:p-3">
            {c.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.iconUrl} alt="" className="size-full object-contain" />
            )}
          </span>
          <span className="text-[13px] leading-4 text-neutral-800 md:text-sm md:font-bold md:tracking-wide md:text-brand md:uppercase">{c.name}</span>
        </Link>
      ))}
    </nav>
  );
}
