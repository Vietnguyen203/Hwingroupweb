"use client";

import Link from "next/link";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";

/** Nút CTV ở header: "Đăng ký CTV" cho khách, "Trang CTV" cho CTV đã duyệt. */
export function AffiliateCta() {
  const code = useAffiliateCode();
  return (
    <Link href="/affiliate" className="hidden shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-4px_rgb(108_59_255/0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-4px_rgb(108_59_255/0.6)] active:translate-y-0 md:block">
      {code ? "Trang CTV" : "Đăng ký CTV"}
    </Link>
  );
}
