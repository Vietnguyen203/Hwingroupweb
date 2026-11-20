"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Handshake, Share2 } from "lucide-react";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { copyText } from "@/lib/clipboard";
import { siteConfig } from "@/lib/config";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Công cụ cho CTV đã duyệt trên thẻ / trang sản phẩm: hoa hồng dự kiến + chép link sản phẩm có mã giới thiệu.
 * Trang chi tiết (variant="detail"): khối nổi bật có hiện sẵn link chia sẻ; khách chưa là CTV thấy lời mời đăng ký CTV
 * kèm hoa hồng ước tính. Thẻ sản phẩm: khách thường không thấy gì. Hoa hồng thật do backend tính khi đơn giao thành công.
 */
export function AffiliateProductTools({ slug, price, variant = "card" }: { slug: string; price: number; variant?: "card" | "detail" }) {
  const code = useAffiliateCode();
  const me = useMe();
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const commission = Math.floor(price * siteConfig.commissionRate);

  // Lần render đầu (hydrate) luôn không hiện gì để khớp HTML server; dữ liệu đăng nhập có sau đó
  if (!mounted) return null;

  // Khách chưa phải CTV (kể cả chưa đăng nhập): mời đăng ký – chỉ ở trang chi tiết
  if (!code) {
    const isStaff = !!me.data?.roles?.includes("ADMIN") || !!me.data?.roles?.includes("AFFILIATE");
    if (variant !== "detail" || me.isPending || isStaff) return null;
    return (
      <Link href="/affiliate" className="flex items-center gap-3 rounded-xl border border-dashed border-brand/40 bg-brand-soft px-3.5 py-3 text-sm transition hover:border-brand">
        <Handshake className="size-6 shrink-0 text-brand" />
        <span className="min-w-0 flex-1 text-neutral-700">
          Giới thiệu sản phẩm này, nhận hoa hồng khoảng <b className="text-brand-red">{formatVnd(commission)}</b> mỗi đơn.
        </span>
        <span className="shrink-0 font-semibold text-brand-link">Đăng ký CTV ›</span>
      </Link>
    );
  }

  const link = () => `${window.location.origin}/products/${slug}?ref=${encodeURIComponent(code)}`;
  const share = async () => {
    if (await copyText(link())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (variant === "card") {
    return (
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-brand-soft px-2 py-1 text-xs text-brand">
        <span>Hoa hồng ~<b>{formatVnd(commission)}</b></span>
        <button type="button" onClick={share} className="flex shrink-0 items-center gap-1 font-semibold text-brand-link hover:underline">
          {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
          {copied ? "Đã chép link" : "Chia sẻ"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-brand/30 bg-brand-soft p-3.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-brand"><Handshake className="size-4" /> Dành cho CTV</span>
        <span className="text-neutral-700">Hoa hồng dự kiến <b className="text-base text-brand-red">{formatVnd(commission)}</b></span>
      </div>
      <div className={cn("flex items-center gap-2 rounded-lg border bg-white p-1 pl-3 text-xs text-neutral-600")}>
        <span className="min-w-0 flex-1 truncate" title="Link chia sẻ có mã giới thiệu của bạn">/products/{slug}?ref={code}</span>
        <button type="button" onClick={share}
                className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Đã chép" : "Chép link"}
        </button>
      </div>
    </div>
  );
}
