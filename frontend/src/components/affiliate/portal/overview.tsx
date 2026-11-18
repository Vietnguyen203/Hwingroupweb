"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, Compass, MousePointerClick, Percent, ShoppingBag } from "lucide-react";

import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { api, errorMessage } from "@/lib/api";
import type { AffiliateDashboard, CommissionResponse, PayoutResponse } from "@/lib/affiliate";
import { buildActivity, formatNumber, formatPercent, monthlyTotals, percentChange } from "@/lib/affiliate-stats";
import { formatVnd } from "@/lib/format";
import type { PageResponse } from "@/lib/types";
import { IncomeSummary } from "./income-summary";
import { KpiCard, type KpiTrend } from "./kpi-card";
import { PayoutCard } from "./payout-card";
import { RecentActivity } from "./recent-activity";

const COMPARE_LABEL = "so với cùng kỳ tháng trước";

/** So tháng này với cùng kỳ tháng trước; không có cơ sở so sánh thì chỉ hiện số của tháng này. */
function monthTrend(current: number, previous: number, show: (n: number) => string): KpiTrend {
  const percent = percentChange(current, previous);
  return percent === null ? { percent: null, label: `Tháng này: ${show(current)}` } : { percent, label: COMPARE_LABEL };
}

/** Trang Tổng quan cổng CTV: lời chào + CTA, 4 KPI, thu nhập & rút tiền, hoạt động gần đây. */
export function Overview() {
  const { profile } = useAffiliateProfile({ syncRole: false });
  const dash = useQuery({
    queryKey: ["affiliate-dashboard"],
    queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard"),
  });
  // Key có hậu tố để không đụng cache phân trang của trang CTV cũ; vẫn bị invalidate theo tiền tố khi rút tiền
  const commissions = useQuery({
    queryKey: ["affiliate-commissions", "overview"],
    queryFn: () => api<PageResponse<CommissionResponse>>("/api/affiliates/me/commissions?page=1&page_size=50"),
  });
  const payouts = useQuery({
    queryKey: ["affiliate-payouts", "overview"],
    queryFn: () => api<PageResponse<PayoutResponse>>("/api/affiliates/me/payouts?page=1&page_size=5"),
  });

  const d = dash.data;
  const pending = d?.commissions.PENDING;
  const approved = d?.commissions.APPROVED;
  const orders = (pending?.count ?? 0) + (approved?.count ?? 0); // đơn hợp lệ = chưa bị hủy
  const estimated = (pending?.amount ?? 0) + (approved?.amount ?? 0);
  const conversion = d && d.clicksTotal > 0 ? (orders / d.clicksTotal) * 100 : 0;
  const monthly = commissions.data ? monthlyTotals(commissions.data) : null;

  const activity = commissions.data && payouts.data ? buildActivity(commissions.data.content, payouts.data.content) : undefined;
  const latestPayout = payouts.data ? (payouts.data.content[0] ?? null) : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Chào mừng quay trở lại, <span className="text-brand-red">{profile.data?.fullName ?? "bạn"}</span>!
          </h1>
          <p className="mt-1 text-sm text-gray-500">Đây là tổng quan hoạt động cộng tác viên của bạn.</p>
        </div>
        <Link
          href="/products"
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-semibold text-white shadow-md shadow-brand-red/25 transition-all hover:bg-brand-red/90 hover:shadow-lg"
        >
          <Compass className="size-4.5" aria-hidden />
          Khám phá sản phẩm
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </header>

      {dash.error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{errorMessage(dash.error)}</span>
          <button onClick={() => dash.refetch()} className="shrink-0 font-semibold underline underline-offset-2">Thử lại</button>
        </div>
      )}

      <section aria-label="Chỉ số chính" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Tổng lượt Click"
          value={formatNumber(d?.clicksTotal ?? 0)}
          icon={MousePointerClick}
          tone="purple"
          loading={dash.isPending}
          trend={{ percent: null, label: `${formatNumber(d?.clicks30Days ?? 0)} lượt trong 30 ngày qua` }}
        />
        <KpiCard
          label="Đơn hàng hợp lệ"
          value={formatNumber(orders)}
          icon={ShoppingBag}
          tone="orange"
          loading={dash.isPending}
          trend={
            monthly
              ? monthTrend(monthly.orders, monthly.prevOrders, (n) => `${n} đơn`)
              : { percent: null, label: `${formatNumber(pending?.count ?? 0)} đơn đang chờ xác nhận` }
          }
        />
        <KpiCard
          label="Tỷ lệ chuyển đổi"
          value={formatPercent(conversion)}
          icon={Percent}
          tone="navy"
          loading={dash.isPending}
          trend={{ percent: null, label: `${formatNumber(orders)} đơn / ${formatNumber(d?.clicksTotal ?? 0)} click` }}
        />
        <KpiCard
          label="Thu nhập ước tính"
          value={formatVnd(estimated)}
          icon={Coins}
          tone="green"
          loading={dash.isPending}
          trend={
            monthly
              ? monthTrend(monthly.income, monthly.prevIncome, formatVnd)
              : { percent: null, label: "Gồm hoa hồng chờ xác nhận và đã duyệt" }
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeSummary dash={d} loading={dash.isPending} />
        <PayoutCard dash={d} latest={latestPayout} />
      </div>

      <RecentActivity items={activity} loading={commissions.isPending || payouts.isPending} />
    </div>
  );
}
