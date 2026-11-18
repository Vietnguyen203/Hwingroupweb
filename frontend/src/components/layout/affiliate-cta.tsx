"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";
import { useMyId } from "@/hooks/use-my-id";
import { portalPath } from "@/lib/portal-path";
import { cn } from "@/lib/utils";

export interface AffiliateCtaProps {
  className?: string;
  variant?: "solid" | "outline" | "vertical";
}

/** Nút CTV ở header: "Đăng ký CTV" cho khách, "Trang CTV" cho CTV đã duyệt. */
export function AffiliateCta({ className, variant = "vertical" }: AffiliateCtaProps) {
  const code = useAffiliateCode();
  const label = code ? "Trang CTV" : "Đăng ký CTV";
  // CTV đã duyệt vào thẳng cổng CTV; khách chưa là CTV vào trang giới thiệu / đăng ký
  const myId = useMyId();
  const href = code ? portalPath("dashboard", myId) : "/affiliate";

  if (variant === "vertical") {
    return (
      <Link
        href={href}
        className={cn(
          "group hidden flex-col items-center gap-1 text-neutral-700 transition hover:text-brand md:flex",
          className
        )}
      >
        <HandCoins className="size-6 text-brand transition-transform group-hover:scale-110" />
        <span className="text-[11px] font-semibold leading-none text-neutral-700 group-hover:text-brand">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "hidden shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:block",
        variant === "outline"
          ? "border border-brand text-brand hover:bg-brand-soft"
          : "bg-brand text-white shadow-sm hover:bg-brand-dark",
        className
      )}
    >
      {label}
    </Link>
  );
}
