import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PORTAL_NAV } from "./nav";

/** Trang giữ chỗ cho mục menu chưa có chức năng riêng (backend chưa có dữ liệu tương ứng). */
export function ComingSoon({ href }: { href: string }) {
  const item = PORTAL_NAV.find((n) => n.href === href);
  if (!item) return null;

  return (
    <div className="mx-auto mt-6 max-w-lg rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <item.icon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-extrabold text-gray-900">{item.label}</h1>
      <p className="mx-auto mt-1 inline-block rounded-full bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-700">Sắp ra mắt</p>
      <p className="mt-3 text-sm text-gray-500">{item.description}</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/affiliate/dashboard" className={cn(buttonVariants(), "h-10 bg-brand-red px-5 font-semibold text-white hover:bg-brand-red/90")}>
          Về Tổng quan
        </Link>
        {item.fallback && (
          <Link href={item.fallback.href} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5 font-semibold")}>
            {item.fallback.label}
          </Link>
        )}
      </div>
    </div>
  );
}
