"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, MousePointerClick, Percent, ShoppingBag } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import type { AffiliateDashboard, CommissionResponse } from "@/lib/affiliate";
import { dailySeries, formatNumber, formatPercent, percentChange, statusSplit, type StatusSplit } from "@/lib/affiliate-stats";
import { formatVnd } from "@/lib/format";
import type { PageResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DailyChart, DailyTable, type Metric } from "./daily-chart";
import { KpiCard, type KpiTrend } from "./kpi-card";
import { Reveal } from "./reveal";

const DAYS = 30; // khớp với số liệu click 30 ngày của backend
const MAX_PAGES = 10; // tối đa 500 hoa hồng gần nhất (50 / trang)

type Fetched = { items: CommissionResponse[]; truncated: boolean };

/** Lấy hoa hồng mới nhất cho tới khi phủ hết 2 kỳ (kỳ này + kỳ trước) hoặc hết dữ liệu. */
async function fetchCommissions(): Promise<Fetched> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS * 2 - 1));

  const items: CommissionResponse[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await api<PageResponse<CommissionResponse>>(`/api/affiliates/me/commissions?page=${page}&page_size=50`);
    items.push(...r.content);
    const oldest = r.content.at(-1);
    if (page >= r.totalPages || !oldest || new Date(oldest.createdAt).getTime() < since.getTime()) return { items, truncated: false };
  }
  return { items, truncated: true };
}

const sum = (pts: { orders: number; income: number }[], k: "orders" | "income") => pts.reduce((n, p) => n + p[k], 0);

/** Trang Hiệu suất: KPI 30 ngày (so với 30 ngày trước), biểu đồ đơn / hoa hồng theo ngày, cơ cấu trạng thái hoa hồng. */
export function Performance() {
  const dash = useQuery({ queryKey: ["affiliate-dashboard"], queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard") });
  const commissions = useQuery({ queryKey: ["affiliate-commissions", "performance"], queryFn: fetchCommissions });
  const [metric, setMetric] = useState<Metric>("orders");
  const [view, setView] = useState<"chart" | "table">("chart");

  const d = dash.data;
  const data = commissions.data;
  const series = data ? dailySeries(data.items, DAYS * 2) : null;
  const current = series?.slice(DAYS) ?? [];
  const previous = series?.slice(0, DAYS) ?? [];
  const orders = sum(current, "orders");
  const income = sum(current, "income");
  const clicks = d?.clicks30Days ?? 0;
  const conversion = clicks > 0 ? (orders / clicks) * 100 : 0;
  const comparable = !!data && !data.truncated; // dữ liệu bị cắt thì không so với kỳ trước (sẽ sai)

  const trend = (cur: number, prev: number, fallback: string): KpiTrend => {
    const p = comparable ? percentChange(cur, prev) : null;
    return p === null ? { percent: null, label: fallback } : { percent: p, label: "so với 30 ngày trước" };
  };

  const loading = dash.isPending || commissions.isPending;
  const error = dash.error ?? commissions.error;

  return (
    <div className="space-y-6">
      <Reveal>
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Hiệu suất</h1>
          <p className="mt-1 text-sm text-gray-500">30 ngày qua, so với 30 ngày trước đó.</p>
        </header>
      </Reveal>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{errorMessage(error)}</span>
          <button onClick={() => { dash.refetch(); commissions.refetch(); }} className="shrink-0 font-semibold underline underline-offset-2">Thử lại</button>
        </div>
      )}

      <section aria-label="Chỉ số 30 ngày" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Lượt click"
          value={clicks}
          format={(n) => formatNumber(Math.round(n))}
          icon={MousePointerClick}
          tone="purple"
          loading={loading}
          delay={80}
          trend={{ percent: null, label: `Tổng từ đầu: ${formatNumber(d?.clicksTotal ?? 0)} lượt` }}
        />
        <KpiCard
          label="Đơn hàng hợp lệ"
          value={orders}
          format={(n) => formatNumber(Math.round(n))}
          icon={ShoppingBag}
          tone="orange"
          loading={loading}
          delay={150}
          trend={trend(orders, sum(previous, "orders"), "Không tính đơn đã hủy")}
        />
        <KpiCard
          label="Tỷ lệ chuyển đổi"
          value={conversion}
          format={formatPercent}
          icon={Percent}
          tone="navy"
          loading={loading}
          delay={220}
          trend={{ percent: null, label: `${formatNumber(orders)} đơn / ${formatNumber(clicks)} click` }}
        />
        <KpiCard
          label="Hoa hồng ước tính"
          value={income}
          format={(n) => formatVnd(Math.round(n))}
          icon={Coins}
          tone="green"
          loading={loading}
          delay={290}
          trend={trend(income, sum(previous, "income"), "Chờ xác nhận + đã duyệt")}
        />
      </section>

      <Reveal delay={340}>
        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">{metric === "orders" ? "Đơn hàng mỗi ngày" : "Hoa hồng mỗi ngày"}</h2>
              <p className="text-sm text-gray-500">30 ngày gần nhất, không tính đơn đã hủy</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Số liệu" value={metric} onChange={setMetric} options={[{ value: "orders", label: "Đơn hàng" }, { value: "income", label: "Hoa hồng" }]} />
              <Segmented label="Cách xem" value={view} onChange={setView} options={[{ value: "chart", label: "Biểu đồ" }, { value: "table", label: "Bảng" }]} />
            </div>
          </div>

          <div className={cn("mt-2 transition-opacity", commissions.isFetching && !commissions.isPending && "opacity-60")}>
            {commissions.isPending ? (
              <div className="mt-4 h-72 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Đang tải" />
            ) : view === "chart" ? (
              <DailyChart points={current} metric={metric} label={metric === "orders" ? "Số đơn mỗi ngày" : "Hoa hồng mỗi ngày"} />
            ) : (
              <div className="mt-3"><DailyTable points={current} /></div>
            )}
          </div>
          {data?.truncated && (
            <p role="note" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Có hơn {MAX_PAGES * 50} hoa hồng gần đây nên số liệu có thể thiếu và chưa so với kỳ trước.
            </p>
          )}
        </section>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal delay={400} className="h-full">
          <StatusCard split={data ? statusSplit(data.items, DAYS) : null} />
        </Reveal>
        <Reveal delay={460} className="h-full">
          <section className="h-full rounded-xl border border-dashed border-gray-200 bg-white/60 p-5">
            <h2 className="text-base font-bold text-gray-900">Chưa có thống kê click theo ngày và theo nền tảng</h2>
            <p className="mt-1 text-sm text-gray-500">
              Hiện chỉ có tổng lượt click (30 ngày và từ đầu). Click theo từng ngày và theo nền tảng chia sẻ (Facebook, Zalo, TikTok…) sẽ bổ sung sau,
              nên biểu đồ trên mới vẽ đơn hàng và hoa hồng.
            </p>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", value === o.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const STATUS_ROWS = [
  { key: "PENDING", label: "Chờ xác nhận", color: "bg-amber-400" },
  { key: "APPROVED", label: "Đã duyệt", color: "bg-green-500" },
  { key: "CANCELLED", label: "Đã hủy", color: "bg-gray-300" },
] as const;

/** Cơ cấu hoa hồng 30 ngày theo trạng thái: thanh phân đoạn mảnh (không chữ) + danh sách có số đơn và số tiền. */
function StatusCard({ split }: { split: StatusSplit | null }) {
  const total = split ? STATUS_ROWS.reduce((n, r) => n + split[r.key].count, 0) : 0;

  return (
    <section className="h-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">Hoa hồng theo trạng thái</h2>
      <p className="text-sm text-gray-500">Các đơn phát sinh trong 30 ngày qua</p>

      {!split ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Đang tải" />
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Chưa có hoa hồng nào trong 30 ngày qua</p>
      ) : (
        <>
          <div role="img" aria-label={STATUS_ROWS.map((r) => `${r.label} ${split[r.key].count} đơn`).join(", ")} className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {STATUS_ROWS.map((r) => split[r.key].count > 0 && (
              <span key={r.key} className={cn("h-full", r.color)} style={{ width: `${(split[r.key].count / total) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 divide-y divide-gray-100 text-sm">
            {STATUS_ROWS.map((r) => (
              <li key={r.key} className="flex items-center gap-3 py-2.5">
                <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", r.color)} />
                <span className="flex-1 font-medium text-gray-700">{r.label}</span>
                <span className="text-gray-500 tabular-nums">{formatNumber(split[r.key].count)} đơn</span>
                <span className={cn("w-28 text-right font-semibold tabular-nums", r.key === "CANCELLED" ? "text-gray-400 line-through" : "text-gray-900")}>{formatVnd(split[r.key].amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
