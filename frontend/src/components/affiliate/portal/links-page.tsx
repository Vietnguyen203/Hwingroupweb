"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { api } from "@/lib/api";
import type { AffiliateDashboard } from "@/lib/affiliate";
import { siteConfig } from "@/lib/config";
import { ShareLink } from "../affiliate-dashboard";

/** Trang Link Affiliate: mã giới thiệu, link chia sẻ (chép 1 chạm) và cách hoạt động. */
export function AffiliateLinks() {
  const { profile } = useAffiliateProfile({ syncRole: false });
  const dash = useQuery({
    queryKey: ["affiliate-dashboard"],
    queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard"),
  });
  const rate = Math.round(siteConfig.commissionRate * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Link Affiliate</h1>
        <p className="mt-1 text-sm text-gray-500">Khách mua qua link của bạn sẽ được gắn với bạn.</p>
      </header>

      <section className="rounded-xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm text-white/80">Mã giới thiệu của bạn</p>
        <p className="mt-0.5 text-3xl font-extrabold tracking-wider">{profile.data?.referralCode ?? "—"}</p>
        {dash.data ? <ShareLink link={dash.data.shareLink} /> : <Skeleton className="mt-3 h-12 rounded-xl bg-white/15" />}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Cách hoạt động</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>Mở một sản phẩm trên cửa hàng, bấm nút chia sẻ để chép link riêng kèm mã của bạn, hoặc chia sẻ link ở trên.</li>
          <li>Khách mua qua link được gắn với bạn vĩnh viễn, các đơn sau của khách vẫn tính hoa hồng cho bạn.</li>
          <li>Hoa hồng {rate}% trên giá trị đơn (trước phí ship), được duyệt sau 7 ngày kể từ khi giao hàng thành công.</li>
        </ol>
        <Link
          href="/products"
          className="group mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
        >
          Chọn sản phẩm để chia sẻ
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
