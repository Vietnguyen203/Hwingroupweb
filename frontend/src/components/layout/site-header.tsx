import { Suspense } from "react";
import Link from "next/link";
import { FileText, Menu, Phone } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCategories } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { AccountLink } from "./account-link";
import { AffiliateCta } from "./affiliate-cta";
import { CartButton } from "./cart-button";
import { CategoryNav } from "./category-nav";
import { MobileMenu } from "./mobile-menu";
import { QuickJumpBar } from "./quick-jump-bar";
import { SearchBox } from "./search-box";

/**
 * SiteHeader đồng bộ chuẩn hệ màu thương hiệu HWIN:
 * 1. Top Bar: Nền đỏ đô đậm (--brand-deep / #4a0a0d), đồng bộ với footer HWIN:
 *    - Freeship đơn từ 500.000đ (nhấn màu vàng hổ phách) · Giao hàng giữ lạnh tận nơi
 *    - 100% Thực phẩm sạch – Đầy đủ giấy tờ VSATTP, ISO 22000
 *    - Hotline & Zalo tư vấn 8:00 – 22:00 (cả T7, CN)
 *    - Mép phải: [icon] Hỗ trợ & chính sách (gạch chân)
 * 2. Main Header: Nền trắng thanh lịch:
 *    - Logo HWIN + slogan nhỏ
 *    - Thanh tìm kiếm viền tím thương hiệu (border-brand), nút "Tìm kiếm" màu brand (bg-brand hover:bg-brand-dark)
 *    - Hotline: Icon trong vòng tròn tím nhạt (bg-brand-soft) + số điện thoại tím đậm (text-brand)
 *    - Đăng ký CTV: Icon + chữ đồng bộ màu brand
 *    - Tài khoản: Icon + chữ
 *    - Giỏ hàng: Icon + badge đỏ + chữ
 * 3. CategoryNav / QuickJumpBar: dòng danh mục cuộn ngang dùng chung token màu brand-soft / brand;
 *    ở trang chủ là thanh dính dưới header, bấm để nhảy tới từng khối của trang.
 */
export function SiteHeader() {
  return (
    <>
      {/* 1. TOP BAR NỀN ĐỎ ĐÔ ĐẬM THƯƠNG HIỆU PHÚC VỊ */}
      <div className="hidden bg-brand-deep py-2 text-xs text-white/85 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span>
              Freeship đơn từ <strong className="font-bold text-amber-400">500.000đ</strong> · Giao hàng giữ lạnh tận nơi
            </span>
            <span className="text-white/20">|</span>
            <span>Chính hãng 100% – Đạt chuẩn VSATTP, ISO 22000</span>
            <span className="text-white/20">|</span>
            <span className="hidden lg:inline">Chuyên gia tư vấn miễn phí 8:00 – 22:00 Các ngày trong tuần</span>
          </div>

          <Link
            href="/chinh-sach"
            className="flex items-center gap-1.5 font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition hover:text-amber-400 hover:decoration-amber-400"
          >
            <FileText className="size-3.5 text-amber-400" />
            <span>Hỗ trợ &amp; chính sách</span>
          </Link>
        </div>
      </div>

      {/* 2. MAIN HEADER NỀN TRẮNG */}
      <header data-site-header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo thương hiệu + Slogan */}
          <div className="flex shrink-0 items-center gap-3">
            <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <div className="flex flex-col">
              <Logo />
              <span className="hidden text-[10px] text-neutral-500 font-medium tracking-tight sm:block -mt-1">
                Thực phẩm sạch chế biến sẵn
              </span>
            </div>
          </div>

          {/* Thanh tìm kiếm viền màu Brand (#9b1c22), nút Tìm kiếm màu Brand, gợi ý sản phẩm khi gõ */}
          <SearchBox />

          {/* Cụm 4 Action bên phải: Hotline, CTV, Tài khoản, Giỏ hàng */}
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            {/* 1. Hotline tư vấn - tông màu Brand */}
            <a
              href={`tel:${siteConfig.hotline}`}
              className="hidden items-center gap-2.5 text-neutral-800 transition hover:opacity-90 xl:flex"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Phone className="size-4.5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm text-brand tracking-tight">{siteConfig.hotline}</span>
                <span className="text-[11px] text-neutral-500 font-medium">Tư vấn miễn phí</span>
              </div>
            </a>

            {/* 2. Đăng ký CTV */}
            <AffiliateCta variant="vertical" />

            {/* 3. Tài khoản */}
            <AccountLink vertical={true} />

            {/* Thông báo (nếu đăng nhập) */}
            <NotificationBell />

            {/* 4. Giỏ hàng */}
            <CartButton showLabel={true} />
          </div>
        </div>
      </header>

      {/* 3. Hàng danh mục cuộn ngang; ở trang chủ là thanh "đi nhanh" dính dưới header (xem QuickJumpBar) */}
      {/* Fallback dùng usePathname nên phải nằm trong Suspense riêng; trang động chưa biết đường dẫn thì giữ chỗ bằng khung tĩnh */}
      <Suspense
        fallback={
          <Suspense fallback={<div className="hidden h-[3.25rem] border-b border-gray-100 bg-white md:block" aria-hidden />}>
            <QuickJumpBar loading />
          </Suspense>
        }
      >
        <CategoryNav />
      </Suspense>
    </>
  );
}

async function MobileMenuLoader() {
  return <MobileMenu categories={await getCategories().catch(() => [])} />;
}
