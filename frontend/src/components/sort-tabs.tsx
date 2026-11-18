import Link from "next/link";

import type { ProductSort } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "NEWEST", label: "Mới nhất" },
  { value: "BESTSELLER", label: "Bán chạy" },
  { value: "PRICE_ASC", label: "Giá thấp" },
  { value: "PRICE_DESC", label: "Giá cao" },
];

export function SortTabs({ basePath, params, current }: {
  basePath: string;
  params: Record<string, string | undefined>;
  current: ProductSort;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-4 md:px-0" role="group" aria-label="Sắp xếp sản phẩm">
      {OPTIONS.map((o) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
        qs.set("sort", o.value);
        return (
          <Link
            key={o.value}
            aria-current={o.value === current ? "true" : undefined}
            href={`${basePath}?${qs.toString()}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition duration-200 active:scale-95",
              o.value === current ? "bg-brand text-white shadow-md shadow-brand/25 ring-brand" : "bg-white text-neutral-700 ring-black/[0.08] hover:text-brand hover:ring-brand/40",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
