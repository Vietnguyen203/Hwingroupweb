"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { api } from "@/lib/api";
import type { AffiliateDashboard } from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bank, Commissions, Customers, Payouts } from "../affiliate-dashboard";

const TABS = [
  { key: "commissions", label: "Hoa hồng" },
  { key: "payouts", label: "Rút tiền" },
  { key: "bank", label: "Ngân hàng" },
  { key: "customers", label: "Khách của tôi" },
] as const;
type Tab = (typeof TABS)[number]["key"];

/** Trang Hoa hồng & Thanh toán: hoa hồng từng đơn, rút tiền, tài khoản ngân hàng, khách đã gắn. `?tab=bank` mở thẳng tab. */
export function Earnings() {
  const wanted = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(TABS.find((t) => t.key === wanted)?.key ?? "commissions");
  const id = useId();
  const { profile } = useAffiliateProfile({ syncRole: false });
  const dash = useQuery({
    queryKey: ["affiliate-dashboard"],
    queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard"),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Hoa hồng &amp; Thanh toán</h1>
        <p className="mt-1 text-sm text-gray-500">Theo dõi hoa hồng từng đơn, rút tiền và quản lý tài khoản nhận tiền.</p>
      </header>

      <section aria-label="Tóm tắt thu nhập" className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Có thể rút", value: dash.data?.availableBalance, tone: "text-brand-red", dot: "bg-brand-red" },
          { label: "Chờ xác nhận", value: dash.data?.commissions.PENDING?.amount ?? (dash.data ? 0 : undefined), tone: "text-gray-900", dot: "bg-amber-400" },
          { label: "Đã nhận", value: dash.data?.paidOut, tone: "text-gray-900", dot: "bg-green-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 sm:text-sm">
              <span aria-hidden className={cn("size-2 rounded-full", s.dot)} />
              {s.label}
            </p>
            {s.value === undefined ? (
              <Skeleton className="mt-2 h-6 w-20 bg-gray-200" />
            ) : (
              <p className={cn("mt-1 text-base font-extrabold tracking-tight tabular-nums sm:text-xl", s.tone)}>{formatVnd(s.value)}</p>
            )}
          </div>
        ))}
      </section>

      <div role="tablist" aria-label="Hoa hồng và thanh toán" className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`${id}-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`${id}-panel`}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-brand-red text-white " : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
        {tab === "commissions" && <Commissions />}
        {tab === "customers" && <Customers />}
        {tab === "payouts" && (dash.data ? <Payouts dash={dash.data} /> : <Skeleton className="h-32 bg-gray-100" />)}
        {tab === "bank" && (profile.data ? <Bank profile={profile.data} /> : <Skeleton className="h-32 bg-gray-100" />)}
      </section>
    </div>
  );
}
