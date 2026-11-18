"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

const TONES = {
  purple: { tile: "from-brand to-brand-dark", bar: "from-brand to-brand-dark", mark: "text-brand" },
  orange: { tile: "from-brand-accent to-brand-red", bar: "from-brand-accent to-brand-red", mark: "text-brand-red" },
  navy: { tile: "from-indigo-500 to-brand-deep", bar: "from-indigo-500 to-brand-deep", mark: "text-brand-deep" },
  green: { tile: "from-emerald-400 to-green-600", bar: "from-emerald-400 to-green-600", mark: "text-green-600" },
} as const;

export type KpiTrend = {
  /** % thay đổi; null = không có kỳ so sánh (chỉ hiện nhãn trung tính). */
  percent: number | null;
  label: string;
};

type Props = {
  label: string;
  value: number;
  /** Định dạng số hiển thị; nhận số thực trong lúc chạy nên tự làm tròn nếu cần. */
  format: (n: number) => string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  trend?: KpiTrend;
  loading?: boolean;
  /** Độ trễ hiệu ứng vào trang (ms). */
  delay?: number;
};

/** Thẻ chỉ số: icon gradient, số lớn chạy từ 0, chỉ báo tăng/giảm (xanh ▲ / đỏ ▼) so với kỳ trước. */
export function KpiCard({ label, value, format, icon: Icon, tone, trend, loading, delay = 0 }: Props) {
  const shown = useCountUp(loading ? 0 : value);
  const t = TONES[tone];

  return (
    <article
      style={{ animationDelay: `${delay}ms` }}
      className="group relative h-full overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500 transition-[transform,box-shadow] ease-out-expo hoverable:hover:-translate-y-1 hoverable:hover:shadow-lg sm:p-5"
    >
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.bar)} />
      <Icon aria-hidden className={cn("pointer-events-none absolute -right-3 -bottom-3 size-24 opacity-[0.06] transition-transform duration-500 group-hover:scale-110", t.mark)} />

      <div className="relative flex items-start justify-between gap-3">
        <h3 className="text-xs font-medium text-gray-500 sm:text-sm">{label}</h3>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md shadow-black/10 sm:size-11", t.tile)}>
          <Icon className="size-4.5 sm:size-5" aria-hidden />
        </span>
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-28 bg-gray-200" />
          <Skeleton className="mt-3 h-4 w-36 bg-gray-100" />
        </>
      ) : (
        <>
          <p className="relative mt-2 break-words text-xl font-extrabold tracking-tight text-gray-900 tabular-nums sm:mt-3 sm:text-2xl 2xl:text-3xl">
            {format(shown)}
          </p>
          {trend && <Trend {...trend} />}
        </>
      )}
    </article>
  );
}

function Trend({ percent, label }: KpiTrend) {
  if (percent === null) return <p className="relative mt-2 text-xs text-gray-500">{label}</p>;

  const up = percent > 0;
  const down = percent < 0;
  const Arrow = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <p className="relative mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
          up ? "bg-green-50 text-green-600" : down ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500",
        )}
      >
        <Arrow className="size-3.5" aria-hidden />
        {up ? "+" : ""}
        {Math.round(percent)}%
      </span>
      <span className="text-gray-500">{label}</span>
    </p>
  );
}
