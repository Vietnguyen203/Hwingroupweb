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
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3">
      {OPTIONS.map((o) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
        qs.set("sort", o.value);
        return (
          <Link
            key={o.value}
            href={`${basePath}?${qs.toString()}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              o.value === current ? "border-brand bg-brand text-white" : "bg-white",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
