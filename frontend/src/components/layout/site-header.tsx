import { Suspense } from "react";
import Link from "next/link";
import { Headset, Info, Menu, Newspaper, Phone, Search, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCategories } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { AccountLink } from "./account-link";
import { AffiliateCta } from "./affiliate-cta";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";

/**
 * Header 2 tầng hiện đại chuẩn TMĐT, kéo dài tràn viền màn hình (full-width):
 * - Top Bar (desktop/tablet): Hotline, Cam kết VSATTP, Chứng nhận VSATTP, Khuyến mãi, Về HWIN, Hỗ trợ Zalo
 * - Main Header:
 *   + Mobile: ☰ · Logo · Ô tìm kiếm bo tròn · Giỏ hàng
 *   + Desktop: Logo (sát lề trái) · Ô tìm kiếm rộng rãi trung tâm · Nút Đăng ký CTV · Tài khoản · Thông báo · Giỏ hàng (sát lề phải)
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* 1. Top Bar: Tràn viền 2 bên, thông tin phụ thoáng đãng */}
      <div className="hidden border-b border-neutral-100 bg-neutral-50/90 text-xs text-neutral-600 md:block">
        <div className="flex w-full items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8 xl:px-12">
          {/* Trái: Cam kết VSATTP & Hotline */}
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-medium text-neutral-600 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Thực phẩm sạch chuẩn VSATTP
            </span>
            <span className="hidden text-neutral-300 sm:inline">|</span>
            <a
              href={`tel:${siteConfig.hotline}`}
              className="inline-flex items-center gap-1 font-semibold text-neutral-800 transition-colors hover:text-brand"
            >
              <Phone className="size-3 text-brand" /> Hotline: {siteConfig.hotline}
            </a>
          </div>

          {/* Phải: Chứng nhận VSATTP · Chính sách · Khuyến mãi · Về chúng tôi · Hỗ trợ */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/chinh-sach?tab=vsattp"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
            >
              <ShieldCheck className="size-3.5 text-emerald-600" /> Chứng nhận VSATTP
            </Link>
            <span className="hidden text-neutral-300 lg:inline">|</span>
            <Link
              href="/chinh-sach"
              className="hidden items-center gap-1 transition-colors hover:text-brand lg:inline-flex"
            >
              Chính sách & Pháp lý
            </Link>
            <span className="text-neutral-300">|</span>
            <Link
              href="/search?sort=PRICE_ASC"
              className="inline-flex items-center gap-1 transition-colors hover:text-brand"
            >
              <Newspaper className="size-3 text-brand" /> Khuyến mãi
            </Link>
            <span className="text-neutral-300">|</span>
            <a
              href={siteConfig.aboutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 transition-colors hover:text-brand xl:inline-flex"
            >
              <Info className="size-3 text-brand" /> Về HWIN
            </a>
            <span className="hidden text-neutral-300 xl:inline">|</span>
            <a
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-brand"
            >
              <Headset className="size-3 text-brand" /> Hỗ trợ Zalo
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Header: Tràn viền rộng rãi tới 2 mép đỏ, ô tìm kiếm to ở giữa */}
      <div className="border-b border-neutral-200">
        <div className="flex w-full items-center gap-3 px-4 py-2 sm:px-6 md:gap-5 md:py-2.5 lg:px-8 xl:px-12">
          {/* Logo & Mobile menu button (sát mép trái) */}
          <div className="flex shrink-0 items-center gap-2">
            <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <Logo />
          </div>

          {/* Search box rộng rãi, mở rộng cân xứng ở giữa */}
          <form
            action="/search"
            method="get"
            role="search"
            className="min-w-0 flex-1 max-w-2xl md:mx-4 lg:max-w-3xl lg:mx-8 xl:max-w-4xl"
          >
            <label className="flex h-10 items-center rounded-full border border-neutral-200 bg-neutral-50 pl-3.5 pr-1 transition-colors focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10 md:h-10.5 md:bg-white">
              <Search className="size-4 shrink-0 text-neutral-400" />
              <input
                name="q"
                type="search"
                placeholder="Tìm kiếm sản phẩm, thực phẩm sạch..."
                maxLength={100}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-neutral-400"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="hidden h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 md:flex"
              >
                <Search className="size-3.5" />
                <span>Tìm</span>
              </button>
            </label>
          </form>

          {/* Cụm hành động bên phải: CTV, Tài khoản, Thông báo, Giỏ hàng (sát mép phải) */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3.5 md:gap-4">
            <AffiliateCta />
            <AccountLink />
            <NotificationBell />
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}

async function MobileMenuLoader() {
  return <MobileMenu categories={await getCategories().catch(() => [])} />;
}
