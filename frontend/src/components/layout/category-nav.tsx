import Link from "next/link";
import { Flame, LayoutGrid } from "lucide-react";

import { getCategories } from "@/lib/catalog";

/**
 * Hàng danh mục dưới header (desktop / tablet): chip "Tất cả", từng danh mục kèm ảnh tròn nhỏ (rê chuột: nền tím nhạt, ảnh phóng nhẹ),
 * nút "Khuyến mãi hot" nổi bật ở mép phải. Hàng này cuộn đi cùng trang (chỉ hàng logo / tìm kiếm dính đầu trang).
 * Danh mục chưa có sản phẩm bị ẩn; lỗi tải danh mục thì không hiện gì (không vỡ header).
 */
export async function CategoryNav() {
  const categories = (await getCategories().catch(() => [])).filter((c) => c.productCount > 0);
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden bg-white shadow-[0_1px_0_rgb(23_23_23/0.06)] md:block">
      <div className="flex w-full items-center gap-3 px-4 py-2 sm:px-6 lg:px-8 xl:px-12">
        <Link
          href="/search"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgb(108_59_255/0.7)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0"
        >
          <LayoutGrid className="size-4" /> Tất cả
        </Link>

        <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                href={`/categories/${c.slug}`}
                className="group/nav flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1.5 text-sm font-semibold whitespace-nowrap text-neutral-700 transition-colors duration-200 hover:bg-brand-soft hover:text-brand"
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
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#a82604] to-brand-red px-4 py-1.5 text-sm font-extrabold text-white shadow-[0_6px_14px_-6px_rgb(214_54_10/0.7)] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 lg:inline-flex"
        >
          <Flame className="size-4 fill-[#ffd400] text-[#ffd400]" /> Khuyến mãi hot
        </Link>
      </div>
    </nav>
  );
}
