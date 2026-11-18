import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Giá gốc gạch ngang (phía trên) + giá bán đỏ đậm – theo kiểu hwingroup.com. */
export function Price({ price, compareAtPrice, size = "sm" }: {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}) {
  const hasCompare = compareAtPrice != null && compareAtPrice > price;
  return (
    <div className={cn("flex", size === "lg" ? "flex-row-reverse items-baseline justify-end gap-3" : "flex-col")}>
      <span className={cn("text-neutral-400 line-through", size === "lg" ? "text-base" : "min-h-4 text-xs")}>
        {hasCompare ? formatVnd(compareAtPrice) : ""}
      </span>
      <span className={cn("font-extrabold tracking-tight text-brand-red", size === "lg" ? "text-3xl" : "text-[17px]")}>{formatVnd(price)}</span>
    </div>
  );
}
