import { Suspense } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "./bottom-nav";
import { FloatingContact } from "./floating-contact";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * Khung giao diện khách: header, footer, nút liên hệ nổi, giỏ hàng nhỏ, thanh điều hướng dưới (mobile).
 * Dùng cho layout nhóm (site) và cho trang 404 gốc, để 404 cũng có header / footer.
 * Nội dung nằm trong main rộng tối đa 6xl, đã có lề: trang con KHÔNG tự thêm max-w / px lần nữa (tránh lệch lề).
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page-bg text-neutral-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 md:px-3">{children}</main>
      <SiteFooter />
      <FloatingContact />
      <CartDrawer />
      <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-14 border-t bg-white md:hidden" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
