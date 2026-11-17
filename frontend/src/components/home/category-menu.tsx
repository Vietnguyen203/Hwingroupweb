import Link from "next/link";

import type { CategoryResponse } from "@/lib/types";

/** Danh mục dạng icon tròn: 4 cột trên mobile, 6 cột trên desktop. */
export function CategoryMenu({ categories }: { categories: CategoryResponse[] }) {
  return (
    <nav aria-label="Danh mục" className="grid grid-cols-4 gap-x-2 gap-y-4 px-3 sm:grid-cols-6">
      {categories.map((c) => (
        <Link key={c.id} href={`/danh-muc/${c.slug}`} className="flex flex-col items-center gap-1.5 text-center">
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#e8f1fd] md:size-24 md:shadow-sm">
            {c.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.iconUrl} alt="" className="size-full object-cover" />
            )}
          </span>
          <span className="text-[13px] leading-4 text-neutral-800 md:text-sm md:font-semibold md:text-brand md:uppercase">{c.name}</span>
        </Link>
      ))}
    </nav>
  );
}
