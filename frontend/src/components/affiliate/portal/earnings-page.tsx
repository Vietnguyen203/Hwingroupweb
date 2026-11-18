"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { api } from "@/lib/api";
import type { AffiliateDashboard } from "@/lib/affiliate";
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
              tab === t.key ? "bg-brand-red text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        {tab === "commissions" && <Commissions />}
        {tab === "customers" && <Customers />}
        {tab === "payouts" && (dash.data ? <Payouts dash={dash.data} /> : <Skeleton className="h-32 bg-gray-100" />)}
        {tab === "bank" && (profile.data ? <Bank profile={profile.data} /> : <Skeleton className="h-32 bg-gray-100" />)}
      </section>
    </div>
  );
}
