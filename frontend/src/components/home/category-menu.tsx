import Link from "next/link";

import type { CategoryResponse } from "@/lib/types";

/**
 * Danh mục: lưới thẻ ngang (ảnh vuông bo nhỏ bên trái, tên và số sản phẩm bên phải), 2 cột trên điện thoại, 6 cột trên máy tính.
 * Ảnh phủ kín ô (object-cover); chưa có ảnh thì hiện ô xám, không có nền màu lộ ra quanh ảnh.
 */
export function CategoryMenu({ categories }: { categories: CategoryResponse[] }) {
  if (!categories || categories.length === 0) return null;
  return (
    <nav aria-label="Danh mục" className="grid grid-cols-2 gap-2.5 px-3 sm:grid-cols-3 md:gap-3 md:px-0 lg:grid-cols-4 xl:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.slug}`}
          className="group/cat flex items-center gap-3 rounded-xl bg-page-bg p-2.5 ring-1 ring-black/[0.06] transition-colors hover:bg-brand-soft hover:ring-brand/30"
        >
          <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
            {c.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.iconUrl} alt="" className="size-full object-cover transition duration-300 group-hover/cat:scale-110" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block line-clamp-2 text-sm leading-tight font-bold text-neutral-900 group-hover/cat:text-brand">{c.name}</span>
            {c.productCount > 0 && <span className="mt-0.5 block text-xs text-neutral-500">{c.productCount} sản phẩm</span>}
          </span>
        </Link>
      ))}
    </nav>
  );
}
