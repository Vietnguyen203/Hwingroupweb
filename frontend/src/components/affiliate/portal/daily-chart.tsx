"use client";

import { useState } from "react";

import { compactVnd, formatNumber, niceScale, type DayPoint } from "@/lib/affiliate-stats";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Metric = "orders" | "income";

const dayShort = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
const dayLong = (d: Date) => d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
const fullValue = (metric: Metric, v: number) => (metric === "orders" ? `${formatNumber(v)} đơn` : formatVnd(v));

/**
 * Biểu đồ cột theo ngày, một chuỗi (một màu, không cần chú giải; tiêu đề ở thẻ chứa đã nói rõ đang vẽ gì).
 * Cột ≤ 24px, bo 4px ở đỉnh, vuông ở đáy, cách nhau 2px; lưới mảnh; chỉ ghi nhãn cột cao nhất.
 * Rê chuột hoặc Tab tới cột để xem chi tiết; mọi giá trị cũng có trong bảng (DailyTable).
 */
export function DailyChart({ points, metric, label }: { points: DayPoint[]; metric: Metric; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  const values = points.map((p) => p[metric]);
  const maxValue = Math.max(0, ...values);
  const { step, top } = niceScale(maxValue, metric === "orders" ? 1 : 50_000);
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const axis = metric === "orders" ? (v: number) => formatNumber(v) : compactVnd;
  const peak = maxValue > 0 ? values.indexOf(maxValue) : -1;
  const labelEvery = n > 14 ? 5 : 1;
  const a = active === null ? null : points[active];

  return (
    <div className="grid grid-cols-[2.75rem_1fr] gap-x-2 pt-10">
      {/* Trục tung */}
      <div aria-hidden className="relative h-56 text-right text-[11px] text-gray-500 tabular-nums">
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>{axis(t)}</span>
        ))}
      </div>

      {/* Vùng vẽ */}
      <div className="relative h-56">
        {ticks.map((t) => (
          <div key={t} aria-hidden className={cn("absolute inset-x-0 border-t", t === 0 ? "border-gray-300" : "border-gray-100")} style={{ bottom: `${(t / top) * 100}%` }} />
        ))}

        <div role="list" aria-label={label} className="absolute inset-0 flex">
          {points.map((p, i) => {
            const v = values[i];
            const h = (v / top) * 100;
            return (
              <div
                key={i}
                role="listitem"
                tabIndex={0}
                aria-label={`${dayLong(p.date)}: ${fullValue(metric, v)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-sm outline-none focus-visible:bg-gray-100/80"
              >
                <span
                  className={cn("mx-px block w-full max-w-6 rounded-t-[4px] transition-colors duration-150", active === i ? "bg-brand-accent" : "bg-brand-red")}
                  style={{ height: `${h}%`, minHeight: v > 0 ? 3 : 0 }}
                />
                {i === peak && (
                  <span className="pointer-events-none absolute -translate-y-1 text-[11px] font-semibold whitespace-nowrap text-gray-700 tabular-nums" style={{ bottom: `${h}%` }}>
                    {axis(v)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {maxValue === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">Chưa có đơn nào trong 30 ngày qua</p>
        )}

        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max min-w-32 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: `clamp(4.5rem, ${((active + 0.5) / n) * 100}%, calc(100% - 4.5rem))`, marginTop: "-0.25rem" }}
          >
            <p className="text-gray-300">{dayLong(a.date)}</p>
            <p className="text-sm font-bold tabular-nums">{fullValue(metric, values[active])}</p>
            <p className="text-gray-400 tabular-nums">{fullValue(metric === "orders" ? "income" : "orders", a[metric === "orders" ? "income" : "orders"])}</p>
          </div>
        )}
      </div>

      <span aria-hidden />
      {/* Trục hoành: ghi nhãn thưa để không chồng nhau */}
      <div aria-hidden className="relative mt-2 h-4">
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <span key={i} className="absolute -translate-x-1/2 text-[11px] whitespace-nowrap text-gray-500" style={{ left: `${((i + 0.5) / n) * 100}%` }}>
              {dayShort(p.date)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** Dạng bảng của cùng số liệu (mới nhất trước) – cho người không dùng chuột / trình đọc màn hình. */
export function DailyTable({ points }: { points: DayPoint[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <caption className="sr-only">Đơn hàng và hoa hồng theo ngày</caption>
        <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left font-semibold">Ngày</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Đơn hàng</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Hoa hồng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...points].reverse().map((p) => (
            <tr key={p.date.getTime()}>
              <th scope="row" className="px-4 py-2 text-left font-medium text-gray-700">{dayLong(p.date)}</th>
              <td className="px-4 py-2 text-right tabular-nums text-gray-700">{formatNumber(p.orders)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-900">{formatVnd(p.income)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
