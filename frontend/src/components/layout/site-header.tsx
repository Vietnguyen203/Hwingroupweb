import { Suspense } from "react";
import Link from "next/link";
import { Flame, Headset, Info, Menu, Phone, RotateCcw, Search, ShieldCheck, Snowflake } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCategories } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { AccountLink } from "./account-link";
import { AffiliateCta } from "./affiliate-cta";
import { CartButton } from "./cart-button";
import { CategoryNav } from "./category-nav";
import { MobileMenu } from "./mobile-menu";

const TOP_LINK = "inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white";

/**
 * Header 3 phần (tràn viền, full-width):
 * 1. Thanh trên (desktop / tablet): nền tím đậm gradient, vạch cam mảnh ở đáy; cam kết giao hàng giữ lạnh / đổi trả / VSATTP,
 *    hotline dạng viên, khuyến mãi, hỗ trợ Zalo. Cuộn trang thì thanh này cuộn đi.
 * 2. Header chính (kính mờ, DÍNH đầu trang): logo · ô tìm kiếm rộng · nút Đăng ký CTV · tài khoản · thông báo · giỏ hàng.
 *    Mobile: ☰ · logo · tìm kiếm · giỏ hàng.
 * 3. Hàng danh mục (desktop / tablet): xem {@link CategoryNav}; cuộn đi cùng trang.
 * Trả về fragment để chỉ header chính dính đầu trang (dính theo khung trang của SiteChrome) và không chiếm nhiều chỗ khi cuộn.
 */
export function SiteHeader() {
  return (
    <>
      {/* 1. Thanh trên */}
      <div className="relative hidden bg-gradient-to-r from-brand-deep via-[#2d1b80] to-brand-deep text-xs text-white/80 md:block">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8 xl:px-12">
          <ul className="flex items-center gap-5 whitespace-nowrap">
            <li className="inline-flex items-center gap-1.5 font-medium">
              <Snowflake className="size-3.5 text-sky-300" /> Giao hàng giữ lạnh
            </li>
            <li className="hidden items-center gap-1.5 font-medium lg:inline-flex">
              <RotateCcw className="size-3.5 text-brand-accent" /> Đổi trả trong 7 ngày
            </li>
            <li>
              <Link href="/chinh-sach?tab=vsattp" className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 transition-colors hover:text-emerald-200">
                <ShieldCheck className="size-3.5" /> Chuẩn VSATTP
              </Link>
            </li>
          </ul>

          <ul className="flex items-center gap-4 whitespace-nowrap">
            <li>
              <a
                href={`tel:${siteConfig.hotline}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <Phone className="size-3.5 text-brand-accent" /> Hotline: {siteConfig.hotline}
              </a>
            </li>
            <li className="hidden lg:block">
              <Link href="/chinh-sach" className={TOP_LINK}>Chính sách & Pháp lý</Link>
            </li>
            <li>
              <Link href="/search?sort=PRICE_ASC" className="inline-flex items-center gap-1.5 font-bold whitespace-nowrap text-brand-accent transition-colors hover:text-white">
                <Flame className="size-3.5" /> Khuyến mãi
              </Link>
            </li>
            <li className="hidden xl:block">
              <a href={siteConfig.aboutUrl} target="_blank" rel="noopener noreferrer" className={TOP_LINK}>
                <Info className="size-3.5 text-brand-accent" /> Về HWIN
              </a>
            </li>
            <li>
              <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className={TOP_LINK}>
                <Headset className="size-3.5 text-brand-accent" /> Hỗ trợ Zalo
              </a>
            </li>
          </ul>
        </div>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-accent/80 to-transparent" />
      </div>

      {/* 2. Header chính (dính đầu trang) */}
      <header className="sticky top-0 z-40 w-full bg-white/90 shadow-[0_1px_0_rgb(23_23_23/0.06)] backdrop-blur-xl">
        <div className="flex w-full items-center gap-3 px-4 py-2 sm:px-6 md:gap-5 md:py-3 lg:px-8 xl:px-12">
          <div className="flex shrink-0 items-center gap-2">
            <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <Logo />
          </div>

          <form action="/search" method="get" role="search" className="max-w-2xl min-w-0 flex-1 md:mx-4 lg:mx-8 lg:max-w-3xl xl:max-w-4xl">
            <label className="flex h-10 items-center rounded-full border border-neutral-200 bg-neutral-100/80 pr-1 pl-3.5 transition focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(108_59_255/0.12)] md:h-12">
              <Search className="size-4 shrink-0 text-neutral-400" />
              <input
                name="q"
                type="search"
                placeholder="Tìm kiếm sản phẩm, thực phẩm sạch..."
                maxLength={100}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-neutral-400 focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgb(108_59_255/0.8)] transition hover:bg-brand-dark active:scale-95 md:flex"
              >
                <Search className="size-4" />
                <span>Tìm</span>
              </button>
            </label>
          </form>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-3.5">
            <AffiliateCta />
            <AccountLink />
            <NotificationBell />
            <CartButton />
          </div>
        </div>
      </header>

      {/* 3. Hàng danh mục */}
      <Suspense fallback={<div className="hidden h-[3.25rem] bg-white shadow-[0_1px_0_rgb(23_23_23/0.06)] md:block" aria-hidden />}>
        <CategoryNav />
      </Suspense>
    </>
  );
}

async function MobileMenuLoader() {
  return <MobileMenu categories={await getCategories().catch(() => [])} />;
}
