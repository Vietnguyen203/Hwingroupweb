import Link from "next/link";
import { Flame, LayoutGrid } from "lucide-react";

import { getCategories } from "@/lib/catalog";

/**
 * Hàng danh mục dưới header (desktop / tablet), cùng khung {@code container} với hai tầng trên:
 * chip "Tất cả" (nền tím nhạt), từng danh mục kèm ảnh tròn nhỏ, nút "Khuyến mãi hot" tông cam nhạt ở mép phải.
 * Danh sách cuộn ngang (ẩn thanh cuộn) khi nhiều danh mục hoặc màn hình hẹp. Hàng này cuộn đi cùng trang.
 * Danh mục chưa có sản phẩm bị ẩn; lỗi tải danh mục thì không hiện gì (không vỡ header).
 */
export async function CategoryNav() {
  const categories = (await getCategories().catch(() => [])).filter((c) => c.productCount > 0);
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden border-b border-gray-100 bg-white md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        <Link
          href="/search"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand transition-colors duration-200 hover:bg-brand hover:text-white"
        >
          <LayoutGrid className="size-4" /> Tất cả
        </Link>

        <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                href={`/categories/${c.slug}`}
                className="group/nav flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1.5 text-sm font-medium whitespace-nowrap text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-brand"
              >
                <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-brand-soft ring-1 ring-brand/10 transition duration-300 ease-spring group-hover/nav:scale-110">
                  {c.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- biểu tượng danh mục từ backend
                    <img src={c.iconUrl} alt="" className="size-full object-contain p-0.5" />
                  )}
                </span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/search?sort=PRICE_ASC"
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-100 px-4 py-1.5 text-sm font-bold text-orange-800 ring-1 ring-orange-200 transition duration-200 hover:from-orange-100 hover:to-orange-200 lg:inline-flex"
        >
          <Flame className="size-4 fill-orange-400 text-orange-500" /> Khuyến mãi hot
        </Link>
      </div>
    </nav>
  );
}
