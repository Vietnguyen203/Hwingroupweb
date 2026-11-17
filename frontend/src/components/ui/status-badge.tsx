import { cn } from "@/lib/utils";

/** Nhãn trạng thái dùng chung (đơn hàng, CTV, hoa hồng, rút tiền). */
export function StatusBadge({ map, value }: { map: Record<string, { label: string; className: string }>; value: string }) {
  const s = map[value] ?? { label: value, className: "bg-neutral-100 text-neutral-700" };
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs whitespace-nowrap", s.className)}>{s.label}</span>;
}
