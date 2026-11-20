import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Tem giá: nhãn đỏ đặc cắt chéo bốn góc (class `.tem`), số tiền lớn bằng phông tiêu đề,
 * "/ đơn vị" và giá gốc gạch ngang nằm nhỏ phía dưới. Dùng ở banner trang chủ và thẻ sản phẩm nổi bật.
 */
export function PriceTag({
  price,
  compareAt,
  unit,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  unit?: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const hasCompare = compareAt != null && compareAt > price;
  return (
    <div className={cn("tem inline-flex shrink-0 flex-col bg-brand-red text-white", size === "lg" ? "px-5 py-3 md:px-8 md:py-5" : "px-4 py-2.5", className)}>
      <span className={cn("font-display leading-none font-extrabold tracking-tight whitespace-nowrap tabular-nums", size === "lg" ? "text-3xl md:text-6xl" : "text-2xl md:text-3xl")}>
        {formatVnd(price)}
      </span>
      {(unit || hasCompare) && (
        <span className={cn("mt-1.5 flex items-baseline gap-2 text-white/85", size === "lg" ? "text-xs md:text-base" : "text-xs")}>
          {unit && <span>/ {unit}</span>}
          {hasCompare && <s className="tabular-nums">{formatVnd(compareAt!)}</s>}
        </span>
      )}
    </div>
  );
}
