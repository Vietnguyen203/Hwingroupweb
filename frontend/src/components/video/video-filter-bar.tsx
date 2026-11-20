import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

import { PLATFORM_LABEL, type VideoPlatform } from "@/lib/videos";
import type { CategoryResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLATFORMS: VideoPlatform[] = ["YOUTUBE", "TIKTOK", "FACEBOOK"];

export function VideoFilterBar({
  currentPlatform,
  currentCategory,
  currentQ,
  categories,
}: {
  currentPlatform?: VideoPlatform;
  currentCategory?: string;
  currentQ?: string;
  categories: CategoryResponse[];
}) {
  const buildHref = (overrides: { platform?: string; category?: string; q?: string }) => {
    const qs = new URLSearchParams();
    const p = overrides.platform !== undefined ? overrides.platform : currentPlatform;
    const c = overrides.category !== undefined ? overrides.category : currentCategory;
    const q = overrides.q !== undefined ? overrides.q : currentQ;

    if (p) qs.set("platform", p);
    if (c) qs.set("category", c);
    if (q) qs.set("q", q);

    const s = qs.toString();
    return s ? `/videos?${s}` : "/videos";
  };

  const hasFilter = Boolean(currentPlatform || currentCategory || currentQ);

  return (
    <div className="mb-6 space-y-4 px-3 md:px-0">
      {/* Hàng tìm kiếm và lọc danh mục */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Ô tìm kiếm video theo tiêu đề */}
        <form action="/videos" method="get" className="relative flex-1 sm:max-w-md">
          {currentPlatform && <input type="hidden" name="platform" value={currentPlatform} />}
          {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            type="search"
            defaultValue={currentQ ?? ""}
            placeholder="Tìm video trải nghiệm, công thức món..."
            className="h-10 w-full rounded-full border border-neutral-200 bg-white pr-4 pl-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
          />
        </form>

        {/* Xóa lọc nhanh nếu đang chọn */}
        {hasFilter && (
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-neutral-500 hover:text-brand sm:self-auto"
          >
            <X className="size-3.5" /> Bỏ tất cả lọc
          </Link>
        )}
      </div>

      {/* Hàng chọn nền tảng & danh mục */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-1 text-xs font-bold text-neutral-500 uppercase sm:inline-flex">
          <Filter className="size-3.5" /> Nền tảng:
        </span>

        {/* Nút tất cả nền tảng */}
        <Link
          href={buildHref({ platform: "" })}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
            !currentPlatform
              ? "bg-brand text-white shadow-xs"
              : "border border-neutral-200 bg-white text-neutral-700 hover:border-brand/40 hover:text-brand",
          )}
        >
          Tất cả
        </Link>

        {PLATFORMS.map((p) => {
          const active = currentPlatform === p;
          return (
            <Link
              key={p}
              href={buildHref({ platform: active ? "" : p })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                active
                  ? "bg-brand text-white shadow-xs"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-brand/40 hover:text-brand",
              )}
            >
              {PLATFORM_LABEL[p]}
            </Link>
          );
        })}

        {/* Danh mục (nếu có) */}
        {categories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 sm:ml-3 sm:border-l sm:border-neutral-200 sm:pl-3">
            <span className="hidden text-xs font-medium text-neutral-400 sm:inline">Danh mục:</span>
            <Link
              href={buildHref({ category: "" })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition",
                !currentCategory
                  ? "bg-brand-soft text-brand font-bold"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-brand",
              )}
            >
              Tất cả
            </Link>
            {categories.map((c) => {
              const active = currentCategory === c.slug;
              return (
                <Link
                  key={c.id}
                  href={buildHref({ category: active ? "" : c.slug })}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition",
                    active
                      ? "bg-brand-soft text-brand font-bold"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-brand",
                  )}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
