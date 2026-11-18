"use client";

import Link from "next/link";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";

/** Nút CTV ở header: "Đăng ký CTV" cho khách, "Trang CTV" cho CTV đã duyệt. */
export function AffiliateCta() {
  const code = useAffiliateCode();
  return (
    <Link href="/affiliate" className="hidden shrink-0 rounded-full border-2 border-brand/30 px-5 py-2 text-sm font-bold text-brand transition-colors duration-200 hover:border-brand hover:bg-brand-soft md:block">
      {code ? "Trang CTV" : "Đăng ký CTV"}
    </Link>
  );
}
