import Link from "next/link";

import { getCategories } from "@/lib/catalog";
import { QuickJumpBar } from "./quick-jump-bar";

/**
 * Hàng danh mục dưới header (desktop / tablet): từng danh mục kèm ảnh tròn nhỏ, trượt ngang (ẩn thanh cuộn) khi nhiều
 * danh mục hoặc màn hình hẹp. Phần khung (chip "Tất cả", nút "Khuyến mãi hot", chế độ dính + nhảy tới mục ở trang chủ)
 * nằm trong QuickJumpBar. Danh mục chưa có sản phẩm bị ẩn; lỗi tải danh mục thì chỉ mất hàng này (không vỡ header).
 */
export async function CategoryNav() {
  const categories = (await getCategories().catch(() => [])).filter((c) => c.productCount > 0);

  return (
    <QuickJumpBar hasCategories={categories.length > 0}>
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
    </QuickJumpBar>
  );
}
