import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";

import { formatVnd } from "@/lib/format";
import {
  filterParams,
  hasFilters,
  hasPriceFilter,
  matchesPreset,
  PRICE_PRESETS,
  type ProductFilters,
} from "@/lib/product-filters";
import { cn } from "@/lib/utils";

/**
 * Thanh lọc sản phẩm cho trang tìm kiếm / danh mục: khoảng giá chọn nhanh, "Còn hàng", "Đang giảm giá".
 * Mỗi nút là một liên kết tới URL đã đổi bộ lọc (render ở server, không cần JS; luôn về trang 1 và giữ nguyên `params`).
 * Bấm lại nút đang bật để tắt. Mobile: một hàng trượt ngang.
 */
export function ProductFilterBar({
  basePath,
  params,
  filters,
}: {
  basePath: string;
  /** Các tham số khác cần giữ nguyên (từ khóa, sắp xếp…). */
  params: Record<string, string | undefined>;
  filters: ProductFilters;
}) {
  const href = (next: ProductFilters) => {
    const qs = new URLSearchParams();
    Object.entries({ ...params, ...filterParams(next) }).forEach(([k, v]) => v && qs.set(k, v));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const noPrice: ProductFilters = { ...filters, minPrice: undefined, maxPrice: undefined };
  const presetActive = PRICE_PRESETS.some((p) => matchesPreset(filters, p));

  return (
    <div
      role="group"
      aria-label="Lọc sản phẩm"
      className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 pb-4 md:flex-wrap md:overflow-visible md:px-0"
    >
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-600">
        <SlidersHorizontal aria-hidden className="size-4" /> Lọc
      </span>

      {PRICE_PRESETS.map((p) => {
        const active = matchesPreset(filters, p);
        return (
          <Chip key={p.label} active={active} href={href(active ? noPrice : { ...filters, minPrice: p.minPrice, maxPrice: p.maxPrice })}>
            {p.label}
          </Chip>
        );
      })}

      {/* Khoảng giá tự nhập trên URL (không trùng mức chọn nhanh) vẫn hiện để biết đang lọc và tắt được */}
      {hasPriceFilter(filters) && !presetActive && (
        <Chip active href={href(noPrice)}>
          {customPriceLabel(filters)}
        </Chip>
      )}

      <Chip active={filters.inStock} href={href({ ...filters, inStock: !filters.inStock })}>
        Còn hàng
      </Chip>
      <Chip active={filters.onSale} href={href({ ...filters, onSale: !filters.onSale })}>
        Đang giảm giá
      </Chip>

      {hasFilters(filters) && (
        <Link
          href={href({ inStock: false, onSale: false })}
          prefetch={false}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-500 underline-offset-4 transition hover:text-brand-red hover:underline"
        >
          <X aria-hidden className="size-3.5" /> Xóa lọc
        </Link>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false} // mỗi liên kết là một trang kết quả riêng, không tải trước
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap ring-1 transition duration-200",
        active
          ? "bg-brand text-white shadow-sm shadow-brand/30 ring-brand"
          : "bg-white text-neutral-700 ring-black/[0.08] hover:text-brand hover:ring-brand/40",
      )}
    >
      {active && <Check aria-hidden className="size-3.5" />}
      {children}
    </Link>
  );
}

function customPriceLabel(f: ProductFilters): string {
  if (f.minPrice !== undefined && f.maxPrice !== undefined) return `${formatVnd(f.minPrice)} – ${formatVnd(f.maxPrice)}`;
  return f.minPrice !== undefined ? `Từ ${formatVnd(f.minPrice)}` : `Đến ${formatVnd(f.maxPrice ?? 0)}`;
}
