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

const TOP_LINK = "inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-brand";

/**
 * Header 3 tầng, nền sáng, dùng chung một khung {@code container mx-auto} (cùng lề trái / phải ở cả ba tầng nên luôn thẳng hàng):
 * 1. Thanh trên (desktop / tablet): nền xám siêu nhạt, chữ nhỏ; cam kết giao hàng giữ lạnh / đổi trả / VSATTP bên trái,
 *    hotline, chính sách, khuyến mãi, Zalo bên phải. Cuộn trang thì thanh này cuộn đi.
 * 2. Header chính (kính mờ, DÍNH đầu trang): logo · ô tìm kiếm (rộng tối đa, căn giữa) · nút "Đăng ký CTV" dạng viền (phụ) ·
 *    cụm icon tài khoản / thông báo / giỏ hàng (mỗi icon bọc p-2 rounded-full, rê chuột nền xám). Nút "Tìm" là nút chính duy nhất.
 *    Mobile: ☰ · logo · tìm kiếm · giỏ hàng.
 * 3. Hàng danh mục (desktop / tablet): xem {@link CategoryNav}; cuộn ngang khi nhiều danh mục, cuộn đi cùng trang.
 * Trả về fragment để chỉ header chính dính đầu trang (dính theo khung trang của SiteChrome).
 */
export function SiteHeader() {
  return (
    <>
      {/* 1. Thanh trên */}
      <div className="hidden border-b border-gray-200 bg-gray-50 text-xs text-gray-600 md:block lg:text-sm">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-5 whitespace-nowrap">
            <li className="inline-flex items-center gap-1.5">
              <Snowflake className="size-4 text-sky-500" /> Giao hàng giữ lạnh
            </li>
            <li className="hidden items-center gap-1.5 xl:inline-flex">
              <RotateCcw className="size-4 text-brand" /> Đổi trả trong 7 ngày
            </li>
            <li>
              <Link href="/chinh-sach?tab=vsattp" className="inline-flex items-center gap-1.5 font-medium text-emerald-700 transition-colors hover:text-emerald-800">
                <ShieldCheck className="size-4" /> Chuẩn VSATTP
              </Link>
            </li>
          </ul>

          <ul className="flex items-center gap-5 whitespace-nowrap">
            <li>
              <a href={`tel:${siteConfig.hotline}`} className="inline-flex items-center gap-1.5 font-semibold text-gray-900 transition-colors hover:text-brand">
                <Phone className="size-4 text-brand" /> Hotline: {siteConfig.hotline}
              </a>
            </li>
            <li className="hidden xl:block">
              <Link href="/chinh-sach" className={TOP_LINK}>Chính sách & Pháp lý</Link>
            </li>
            <li className="hidden lg:block">
              <Link href="/search?sort=PRICE_ASC" className={`${TOP_LINK} font-semibold text-brand-red`}>
                <Flame className="size-4" /> Khuyến mãi
              </Link>
            </li>
            <li className="hidden 2xl:block">
              <a href={siteConfig.aboutUrl} target="_blank" rel="noopener noreferrer" className={TOP_LINK}>
                <Info className="size-4 text-gray-400" /> Về HWIN
              </a>
            </li>
            <li>
              <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className={TOP_LINK}>
                <Headset className="size-4 text-gray-400" /> Hỗ trợ Zalo
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. Header chính (dính đầu trang) */}
      <header className="sticky top-0 z-40 w-full bg-white/90 shadow-[0_1px_0_rgb(23_23_23/0.06)] backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-3 px-4 py-2 sm:px-6 md:gap-6 md:py-3 lg:px-8">
          <div className="flex shrink-0 items-center gap-2">
            <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <Logo />
          </div>

          <form action="/search" method="get" role="search" className="mx-auto w-full max-w-xl min-w-0 flex-1 lg:max-w-2xl">
            <label className="flex h-10 items-center rounded-full border border-gray-200 bg-gray-50 pr-1 pl-3.5 transition focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(108_59_255/0.12)] md:h-11">
              <Search className="size-4 shrink-0 text-gray-400" />
              <input
                name="q"
                type="search"
                placeholder="Tìm kiếm sản phẩm, thực phẩm sạch..."
                maxLength={100}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-gray-400 focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 md:flex"
              >
                <Search className="size-4" />
                <span>Tìm</span>
              </button>
            </label>
          </form>

          <div className="flex shrink-0 items-center gap-2 md:gap-4">
            <AffiliateCta />
            <div className="flex items-center gap-0.5 md:gap-1">
              <AccountLink />
              <NotificationBell />
              <CartButton />
            </div>
          </div>
        </div>
      </header>

      {/* 3. Hàng danh mục */}
      <Suspense fallback={<div className="hidden h-[3.25rem] border-b border-gray-100 bg-white md:block" aria-hidden />}>
        <CategoryNav />
      </Suspense>
    </>
  );
}

async function MobileMenuLoader() {
  return <MobileMenu categories={await getCategories().catch(() => [])} />;
}
