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

const TOP_LINK = "inline-flex items-center gap-1 transition-colors hover:text-white";

/**
 * Header 2 tầng, kính mờ, dính đầu trang, kéo dài tràn viền (full-width):
 * - Thanh trên (desktop/tablet, nền tím đậm): hotline, cam kết VSATTP, chứng nhận, chính sách, khuyến mãi, hỗ trợ Zalo.
 * - Header chính:
 *   + Mobile: ☰ · Logo · ô tìm kiếm bo tròn · giỏ hàng
 *   + Desktop: Logo · ô tìm kiếm rộng ở giữa · nút Đăng ký CTV · tài khoản · thông báo · giỏ hàng
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 shadow-[0_1px_0_rgb(23_23_23/0.06)] backdrop-blur-xl">
      {/* 1. Thanh trên */}
      <div className="hidden bg-brand-deep text-xs whitespace-nowrap text-white/75 md:block">
        <div className="flex w-full items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-medium lg:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Thực phẩm sạch chuẩn VSATTP
            </span>
            <span className="hidden text-white/25 sm:inline">|</span>
            <a href={`tel:${siteConfig.hotline}`} className="inline-flex items-center gap-1 font-semibold text-white transition-colors hover:text-brand-accent">
              <Phone className="size-3 text-brand-accent" /> Hotline: {siteConfig.hotline}
            </a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link href="/chinh-sach?tab=vsattp" className="inline-flex items-center gap-1 font-semibold text-emerald-300 transition-colors hover:text-emerald-200">
              <ShieldCheck className="size-3.5" /> Chứng nhận VSATTP
            </Link>
            <span className="hidden text-white/25 lg:inline">|</span>
            <Link href="/chinh-sach" className={`hidden lg:inline-flex ${TOP_LINK}`}>
              Chính sách & Pháp lý
            </Link>
            <span className="text-white/25">|</span>
            <Link href="/search?sort=PRICE_ASC" className={TOP_LINK}>
              <Newspaper className="size-3 text-brand-accent" /> Khuyến mãi
            </Link>
            <span className="text-white/25">|</span>
            <a href={siteConfig.aboutUrl} target="_blank" rel="noopener noreferrer" className={`hidden xl:inline-flex ${TOP_LINK}`}>
              <Info className="size-3 text-brand-accent" /> Về HWIN
            </a>
            <span className="hidden text-white/25 xl:inline">|</span>
            <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className={TOP_LINK}>
              <Headset className="size-3 text-brand-accent" /> Hỗ trợ Zalo
            </a>
          </div>
        </div>
      </div>

      {/* 2. Header chính */}
      <div>
        <div className="flex w-full items-center gap-3 px-4 py-2 sm:px-6 md:gap-5 md:py-2.5 lg:px-8 xl:px-12">
          <div className="flex shrink-0 items-center gap-2">
            <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <Logo />
          </div>

          <form action="/search" method="get" role="search" className="max-w-2xl min-w-0 flex-1 md:mx-4 lg:mx-8 lg:max-w-3xl xl:max-w-4xl">
            <label className="flex h-10 items-center rounded-full border border-neutral-200 bg-neutral-100/80 pr-1 pl-3.5 transition focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(108_59_255/0.12)] md:h-11">
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
                className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-xs font-bold text-white transition hover:bg-brand-dark active:scale-95 md:flex"
              >
                <Search className="size-3.5" />
                <span>Tìm</span>
              </button>
            </label>
          </form>

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
