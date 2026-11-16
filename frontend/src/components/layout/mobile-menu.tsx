"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import type { Category } from "@/lib/types";

/** Nút ☰ trên mobile – mở ngăn trượt danh mục. */
export function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
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
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Danh mục sản phẩm</p>
            <ul className="flex-1 overflow-y-auto">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/c/${c.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 active:bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.iconUrl && <img src={c.iconUrl} alt="" className="size-8" />}
                    <span className="flex-1 text-sm">{c.name}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t p-4">
              <Link href="/ctv" onClick={() => setOpen(false)} className="block rounded-full bg-brand-cta py-2.5 text-center text-sm font-semibold text-white">
                Đăng ký cộng tác viên
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
