import { Suspense } from "react";
import Link from "next/link";
import { Headset, Info, Menu, Newspaper, Phone, Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { getCategories } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";
import { AccountLink } from "./account-link";
import { AffiliateCta } from "./affiliate-cta";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";

/**
 * Header trắng theo hwingroup.com:
 * - Mobile: ☰ · logo · ô tìm kiếm bo tròn · giỏ hàng
 * - Desktop: logo · tìm kiếm (nút navy) · hỗ trợ / hotline · nút đỏ "Đăng ký CTV" · tài khoản · giỏ
 *   + hàng menu danh mục bên dưới.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 md:gap-5 md:py-3">
        <Suspense fallback={<Menu className="size-6 text-brand md:hidden" />}>
          <MobileMenuLoader />
        </Suspense>
        <Logo />

        <form action="/search" method="get" role="search" className="min-w-0 flex-1 md:max-w-xl">
          <label className="flex h-10 items-center rounded-full bg-neutral-100 pl-3 md:border md:border-neutral-200 md:bg-white">
            <Search className="size-4 shrink-0 text-neutral-500 md:hidden" />
            <input
              name="q"
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              maxLength={100}
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <button type="submit" aria-label="Tìm kiếm" className="mr-1 hidden h-8 w-12 items-center justify-center rounded-full bg-brand text-white md:flex">
              <Search className="size-4" />
            </button>
          </label>
        </form>

        <div className="hidden items-center gap-5 text-sm text-neutral-700 xl:flex">
          <a href={siteConfig.aboutUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand">
            <Info className="size-4 text-brand" /> Về chúng tôi
          </a>
          <Link href="/search?sort=PRICE_ASC" className="flex items-center gap-1.5 hover:text-brand"><Newspaper className="size-4 text-brand" /> Khuyến mãi</Link>
          <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand">
            <Headset className="size-4 text-brand" /> Hỗ trợ
          </a>
          <a href={`tel:${siteConfig.hotline}`} className="flex items-center gap-1.5 hover:text-brand">
            <Phone className="size-4 text-brand" /> {siteConfig.hotline}
          </a>
        </div>
        <AffiliateCta />
        <AccountLink />
        <CartButton />
      </div>
    </header>
  );
}

async function MobileMenuLoader() {
  // Menu chỉ là phụ: backend lỗi thì để trống, không làm sập cả trang (trang tự báo lỗi ở phần nội dung)
  return <MobileMenu categories={await getCategories().catch(() => [])} />;
}
