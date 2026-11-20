import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { PortalSlug } from "@/lib/portal-path";
import { cn } from "@/lib/utils";
import { PORTAL_NAV } from "./nav";
import { PortalLink } from "./portal-link";
import { Reveal } from "./reveal";

const BARS = [38, 62, 48, 80, 56, 92, 70, 100, 76, 88];

/** Trang giữ chỗ cho mục menu chưa có chức năng riêng (backend chưa có dữ liệu tương ứng), kèm hình phác thảo sắp có. */
export function ComingSoon({ slug }: { slug: PortalSlug }) {
  const item = PORTAL_NAV.find((n) => n.slug === slug);
  if (!item) return null;

  return (
    <Reveal className="mx-auto max-w-3xl">
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white ">
        <div className="px-6 pt-10 pb-8 text-center sm:px-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/25">
            <item.icon className="size-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900">{item.label}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            Sắp ra mắt
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">{item.description}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <PortalLink slug="dashboard" className={cn(buttonVariants(), "h-10 bg-brand-red px-5 font-semibold text-white hover:bg-brand-red/90")}>
              Về Tổng quan
            </PortalLink>
            {item.fallback && (
              <Link href={item.fallback.href} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5 font-semibold")}>
                {item.fallback.label}
              </Link>
            )}
          </div>
        </div>

        {item.preview && (
          <div aria-hidden className="relative border-t border-gray-100 bg-gray-50 px-6 py-6 sm:px-10">
            {item.preview === "chart" ? <ChartPreview /> : <CardsPreview />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}
      </section>
    </Reveal>
  );
}

/** Hình phác thảo biểu đồ cột – chỉ là khối màu, không có số liệu. */
function ChartPreview() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 opacity-80">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 rounded-full bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-6 w-14 rounded-full bg-brand-soft" />
          <div className="h-6 w-14 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 flex h-36 items-end gap-2">
        {BARS.map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-t-md bg-brand/15" />
        ))}
      </div>
    </div>
  );
}

/** Hình phác thảo lưới thẻ – chỉ là khối màu, không có nội dung. */
function CardsPreview() {
  return (
    <div className="grid grid-cols-3 gap-3 opacity-80">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-3">
          <div className="aspect-[4/3] rounded-lg bg-brand-soft" />
          <div className="mt-3 h-3 w-4/5 rounded-full bg-gray-200" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-100" />
          <div className="mt-3 h-6 w-16 rounded-full bg-orange-100" />
        </div>
      ))}
    </div>
  );
}
