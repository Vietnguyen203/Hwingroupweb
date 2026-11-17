"use client";

import Link from "next/link";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";

/** Nút CTV ở header: "Đăng ký CTV" cho khách, "Trang CTV" cho CTV đã duyệt. */
export function AffiliateCta() {
  const code = useAffiliateCode();
  return (
    <Link href="/affiliate" className="hidden shrink-0 rounded-full bg-brand-cta px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 md:block">
      {code ? "Trang CTV" : "Đăng ký CTV"}
    </Link>
  );
}
