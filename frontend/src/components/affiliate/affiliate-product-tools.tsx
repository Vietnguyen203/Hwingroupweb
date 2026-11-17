"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";
import { siteConfig } from "@/lib/config";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Công cụ cho CTV đã duyệt trên thẻ / trang sản phẩm: hoa hồng dự kiến + chép link sản phẩm có mã giới thiệu.
 * Khách thường không thấy gì. Hoa hồng thật do backend tính khi đơn giao thành công.
 */
export function AffiliateProductTools({ slug, price, variant = "card" }: { slug: string; price: number; variant?: "card" | "detail" }) {
  const code = useAffiliateCode();
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const commission = Math.floor(price * siteConfig.commissionRate);
  const share = async () => {
    const link = `${window.location.origin}/san-pham/${slug}?ref=${encodeURIComponent(code)}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-lg bg-brand-soft text-brand",
      variant === "card" ? "mt-2 px-2 py-1 text-xs" : "px-3 py-2.5 text-sm")}>
      <span>Hoa hồng ~<b>{formatVnd(commission)}</b></span>
      <button type="button" onClick={share} className="flex shrink-0 items-center gap-1 font-semibold text-brand-link hover:underline">
        {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
        {copied ? "Đã chép link" : variant === "card" ? "Chia sẻ" : "Chép link chia sẻ"}
      </button>
    </div>
  );
}
