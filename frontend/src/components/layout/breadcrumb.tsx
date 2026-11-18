import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/** Đường dẫn "Trang chủ › … › trang hiện tại": mục cuối không có href. Lề dọc / ngang do trang cha quyết định. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Trang chủ", href: "/" }, ...items];
  return (
    <nav aria-label="Đường dẫn" className={cn("flex flex-wrap items-center gap-2 text-sm text-neutral-600 md:text-base", className)}>
      {all.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-4 shrink-0 text-neutral-400" aria-hidden />}
          {c.href && i < all.length - 1 ? (
            <Link href={c.href} className="font-medium transition-colors hover:text-brand">{c.label}</Link>
          ) : (
            <span aria-current={i === all.length - 1 ? "page" : undefined} className={cn(i === all.length - 1 && "line-clamp-1 font-semibold text-neutral-900")}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
