import Link from "next/link";
import { Phone, Search } from "lucide-react";

import { siteConfig } from "@/lib/config";
import { CartButton } from "./cart-button";

/** Header mobile-first: logo – hotline – giỏ hàng, dòng dưới là ô tìm kiếm. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex max-w-screen-lg items-center gap-3 px-3 pt-2">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-wide" aria-label="Trang chủ">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-lg text-brand">H</span>
          <span className="text-lg">HWIN</span>
        </Link>
        <a
          href={`tel:${siteConfig.hotline}`}
          className="ml-auto flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold"
        >
          <Phone className="size-4" />
          <span className="hidden min-[360px]:inline">{siteConfig.hotline}</span>
        </a>
        <CartButton />
      </div>
      <form action="/search" method="get" role="search" className="mx-auto max-w-screen-lg px-3 py-2">
        <label className="flex items-center gap-2 rounded-full bg-white px-3 text-foreground">
          <Search className="size-4 text-muted-foreground" />
          <input
            name="q"
            type="search"
            placeholder="Tìm chả lụa, lạp xưởng, nem chua..."
            className="h-10 w-full bg-transparent text-sm outline-none"
            maxLength={100}
          />
        </label>
      </form>
    </header>
  );
}
