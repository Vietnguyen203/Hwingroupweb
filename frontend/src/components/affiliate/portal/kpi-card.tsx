import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TONES = {
  purple: "bg-brand-soft text-brand",
  orange: "bg-orange-50 text-brand-red",
  navy: "bg-indigo-50 text-brand-deep",
  green: "bg-green-50 text-green-700",
} as const;

export type KpiTrend = {
  /** % thay đổi; null = không có kỳ so sánh (chỉ hiện nhãn trung tính). */
  percent: number | null;
  label: string;
};

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  trend?: KpiTrend;
  loading?: boolean;
};

/** Thẻ chỉ số: icon, số lớn, chỉ báo tăng/giảm (xanh ▲ / đỏ ▼) so với kỳ trước. */
export function KpiCard({ label, value, icon: Icon, tone, trend, loading }: Props) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 transition-[transform,box-shadow] duration-200 ease-out-expo hoverable:hover:-translate-y-0.5 hoverable:hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-medium text-gray-500 sm:text-sm">{label}</h3>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl", TONES[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-28 bg-gray-200" />
          <Skeleton className="mt-3 h-4 w-36 bg-gray-100" />
        </>
      ) : (
        <>
          <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-gray-900 tabular-nums sm:mt-3 sm:text-2xl 2xl:text-3xl">{value}</p>
          {trend && <Trend {...trend} />}
        </>
      )}
    </article>
  );
}

function Trend({ percent, label }: KpiTrend) {
  if (percent === null) return <p className="mt-2 text-xs text-gray-500">{label}</p>;

  const up = percent > 0;
  const down = percent < 0;
  const Arrow = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-green-600" : down ? "text-red-600" : "text-gray-500")}>
        <Arrow className="size-3.5" aria-hidden />
        {up ? "+" : ""}
        {Math.round(percent)}%
      </span>
      <span className="text-gray-500">{label}</span>
    </p>
  );
}
