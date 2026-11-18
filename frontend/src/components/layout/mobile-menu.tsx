"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Headset, Info, Menu, Phone, ShieldCheck, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { useAffiliateCode } from "@/hooks/use-affiliate-code";
import { useMyId } from "@/hooks/use-my-id";
import { portalPath } from "@/lib/portal-path";
import { siteConfig } from "@/lib/config";
import type { CategoryResponse } from "@/lib/types";

/** Nút ☰ trên mobile – mở ngăn trượt danh mục và chính sách. */
export function MobileMenu({ categories }: { categories: CategoryResponse[] }) {
  const [open, setOpen] = useState(false);
  const isAffiliate = !!useAffiliateCode();
  const myId = useMyId();
  return (
    <>
      <button type="button" aria-label="Mở menu" onClick={() => setOpen(true)} className="-ml-1 p-1 text-brand md:hidden">
        <Menu className="size-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button aria-label="Đóng menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-4/5 max-w-xs flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Logo />
              <button aria-label="Đóng" onClick={() => setOpen(false)} className="p-1"><X className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Danh mục sản phẩm</p>
              <ul>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categories/${c.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 active:bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.iconUrl && <img src={c.iconUrl} alt="" className="size-8" />}
                      <span className="flex-1 text-sm">{c.name}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="border-t px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Chính sách & An toàn</p>
              <ul className="space-y-0.5 px-2 pb-4 text-sm text-neutral-700">
                <li>
                  <Link
                    href="/chinh-sach?tab=vsattp"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    <ShieldCheck className="size-4 text-emerald-600" />
                    Chứng nhận VSATTP
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chinh-sach"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-100"
                  >
                    <FileText className="size-4 text-brand" />
                    Chính sách & Pháp lý
                  </Link>
                </li>
                <li>
                  <a
                    href={siteConfig.aboutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-100"
                  >
                    <Info className="size-4 text-brand" />
                    Về HWIN Group
                  </a>
                </li>
                <li>
                  <a
                    href={siteConfig.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-100"
                  >
                    <Headset className="size-4 text-brand" />
                    Hỗ trợ Zalo
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${siteConfig.hotline}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-semibold text-neutral-900 hover:bg-neutral-100"
                  >
                    <Phone className="size-4 text-brand" />
                    Hotline: {siteConfig.hotline}
                  </a>
                </li>
              </ul>
            </div>
            <div className="border-t p-4">
              <Link href={isAffiliate ? portalPath("dashboard", myId) : "/affiliate"} onClick={() => setOpen(false)} className="block rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-center text-sm font-bold text-white shadow-md shadow-brand/25">
                {isAffiliate ? "Trang cộng tác viên" : "Đăng ký cộng tác viên"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
