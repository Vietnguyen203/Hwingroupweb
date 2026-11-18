"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgePercent, Share2, UserCheck } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { api } from "@/lib/api";
import type { AffiliateDashboard } from "@/lib/affiliate";
import { siteConfig } from "@/lib/config";
import { ShareLink } from "../affiliate-dashboard";
import { Reveal } from "./reveal";

/** Trang Link Affiliate: mã giới thiệu, link chia sẻ (chép 1 chạm) và cách hoạt động. */
export function AffiliateLinks() {
  const { profile } = useAffiliateProfile({ syncRole: false });
  const dash = useQuery({
    queryKey: ["affiliate-dashboard"],
    queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard"),
  });
  const rate = Math.round(siteConfig.commissionRate * 100);

  const steps = [
    { icon: Share2, title: "Chia sẻ link của bạn", text: "Chép link ở trên, hoặc bấm nút chia sẻ ở từng sản phẩm để có link kèm mã của bạn." },
    { icon: UserCheck, title: "Khách được gắn với bạn", text: "Khách mua qua link được gắn vĩnh viễn, các đơn sau của khách vẫn tính hoa hồng cho bạn." },
    { icon: BadgePercent, title: `Nhận hoa hồng ${rate}%`, text: "Tính trên giá trị đơn (trước phí ship), được duyệt sau 7 ngày kể từ khi giao hàng thành công." },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Link Affiliate</h1>
          <p className="mt-1 text-sm text-gray-500">Khách mua qua link của bạn sẽ được gắn với bạn.</p>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep via-brand-dark to-brand p-5 text-white shadow-lg shadow-brand/20 sm:p-6">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 -z-10 size-64 rounded-full bg-brand-accent/30 blur-3xl" />
          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">Mã giới thiệu của bạn</p>
          <p className="mt-1 text-3xl font-black tracking-[0.2em]">{profile.data?.referralCode ?? "········"}</p>
          {dash.data ? <ShareLink link={dash.data.shareLink} /> : <Skeleton className="mt-3 h-12 rounded-xl bg-white/15" />}
        </section>
      </Reveal>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-base font-bold text-gray-900">Cách hoạt động</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal delay={160 + i * 70} className="h-full">
                <div className="relative h-full overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-[transform,box-shadow] duration-200 hoverable:hover:-translate-y-1 hoverable:hover:shadow-md">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-accent to-brand-red text-white shadow-md shadow-brand-red/20">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span aria-hidden className="absolute top-3 right-4 text-4xl font-black text-gray-100">{i + 1}</span>
                  <h3 className="mt-3 font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <Reveal delay={400}>
        <Link
          href="/products"
          className="group inline-flex h-11 items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-semibold text-white shadow-md shadow-brand-red/25 transition-all hover:bg-brand-red/90 hover:shadow-lg"
        >
          Chọn sản phẩm để chia sẻ
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </Reveal>
    </div>
  );
}
