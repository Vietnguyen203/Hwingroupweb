import Link from "next/link";

import type { Category } from "@/lib/types";

/** Menu danh mục dạng icon (lưới 3 cột trên mobile, 6 cột trên màn rộng). */
export function CategoryMenu({ categories }: { categories: Category[] }) {
  return (
    <nav aria-label="Danh mục" className="grid grid-cols-3 gap-2 px-3 sm:grid-cols-6">
      {categories.map((c) => (
        <Link key={c.id} href={`/c/${c.slug}`} className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-2 text-center shadow-sm">
          {c.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.iconUrl} alt="" className="size-14" />
          ) : (
            <span className="size-14 rounded-full bg-brand-soft" />
          )}
          <span className="text-xs leading-4 font-medium">{c.name}</span>
        </Link>
      ))}
    </nav>
  );
}
