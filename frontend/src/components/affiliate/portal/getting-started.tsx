import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import type { AffiliateDashboard } from "@/lib/affiliate";
import type { PortalSlug } from "@/lib/portal-path";
import { cn } from "@/lib/utils";
import { PortalLink } from "./portal-link";

type Step = {
  title: string;
  text: string;
  done: boolean;
  action: string;
  /** Đích trong cổng CTV (link có id) hoặc đường dẫn thường. */
  to: { slug: PortalSlug; search?: string } | { href: string };
};

const ACTION_CLASS = "group mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-red";

/** Checklist "Bắt đầu nhanh" cho CTV mới – tự ẩn khi đã hoàn thành cả 3 bước (suy ra từ dữ liệu thật). */
export function GettingStarted({ dash, orders }: { dash: AffiliateDashboard; orders: number }) {
  const steps: Step[] = [
    { title: "Chia sẻ link giới thiệu", text: "Gửi link của bạn cho bạn bè, nhóm Facebook, Zalo.", done: dash.clicksTotal > 0, to: { slug: "links" }, action: "Lấy link" },
    { title: "Thêm tài khoản ngân hàng", text: "Để nhận hoa hồng về tài khoản của bạn.", done: dash.hasBankAccount, to: { slug: "earnings", search: "?tab=bank" }, action: "Thêm ngay" },
    { title: "Nhận đơn hàng đầu tiên", text: "Khách mua qua link của bạn là có hoa hồng.", done: orders > 0, to: { href: "/products" }, action: "Chọn sản phẩm" },
  ];
  const finished = steps.filter((s) => s.done).length;
  if (finished === steps.length) return null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">Bắt đầu nhanh</h2>
          <p className="text-sm text-gray-500">Hoàn thành 3 bước để nhận hoa hồng đầu tiên.</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={finished}
            aria-label="Tiến độ bắt đầu nhanh"
            className="h-2 w-28 overflow-hidden rounded-full bg-gray-100"
          >
            <div className="h-full rounded-full bg-brand-accent transition-[width] duration-700" style={{ width: `${(finished / steps.length) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-gray-700 tabular-nums">{finished}/{steps.length}</span>
        </div>
      </div>

      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={cn(
              "flex gap-3 rounded-xl border p-4 transition-colors",
              s.done ? "border-green-100 bg-green-50/60" : "border-gray-100 bg-gray-50/60 hoverable:hover:border-brand-red/30 hoverable:hover:bg-white",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                s.done ? "bg-green-500 text-white" : "bg-white text-brand-red ring-2 ring-brand-red/25",
              )}
            >
              {s.done ? <Check className="size-4.5" aria-hidden /> : i + 1}
              <span className="sr-only">{s.done ? " – đã xong" : " – chưa làm"}</span>
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", s.done ? "text-gray-500 line-through" : "text-gray-900")}>{s.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{s.text}</p>
              {!s.done &&
                ("slug" in s.to ? (
                  <PortalLink slug={s.to.slug} search={s.to.search} className={ACTION_CLASS}>
                    {s.action}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </PortalLink>
                ) : (
                  <Link href={s.to.href} className={ACTION_CLASS}>
                    {s.action}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
