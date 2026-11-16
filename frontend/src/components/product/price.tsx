import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Giá bán + giá gốc gạch ngang. */
export function Price({ price, compareAtPrice, size = "sm" }: {
  price: number;
  compareAtPrice: number | null;
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn("font-bold text-brand", size === "lg" ? "text-2xl" : "text-base")}>{formatVnd(price)}</span>
      {compareAtPrice != null && compareAtPrice > price && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
          {formatVnd(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
