"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { useMounted } from "@/hooks/use-mounted";
import { initials } from "@/lib/affiliate-stats";
import { activeSlug } from "@/lib/portal-path";
import { PORTAL_NAV } from "./nav";
import { PortalLink } from "./portal-link";
import { Sidebar } from "./sidebar";

/**
 * Khung cổng CTV: sidebar cố định bên trái (desktop) hoặc thanh trên + ngăn kéo (mobile), nội dung bên phải nền xám nhạt.
 * Luôn render `children`; việc chỉ cho CTV đã duyệt xem nội dung do PortalGate ở từng trang đảm nhiệm.
 * Ngăn kéo tự đóng khi bấm một mục (onClose của Sidebar), nên không cần theo dõi pathname ở đây.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAffiliateProfile({ syncRole: false }); // chỉ đọc tên cho sidebar; PortalGate lo làm mới phiên
  const [open, setOpen] = useState(false);

  // Ngăn kéo mở: Esc để đóng, khóa cuộn nền
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const mounted = useMounted();
  const a = mounted ? profile.data : undefined; // lần render đầu (hydrate) chưa có tên để khớp HTML server

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar cố định – desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 lg:block">
        <Sidebar profile={a} />
      </aside>

      <div className="lg:pl-64">
        {/* Thanh trên – desktop: vị trí hiện tại, thông báo, người dùng */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 px-8 backdrop-blur-md lg:flex">
          <nav aria-label="Vị trí hiện tại" className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Cổng CTV</span>
            <ChevronRight className="size-4 text-gray-300" aria-hidden />
            <Suspense fallback={<span className="font-semibold text-gray-800">&nbsp;</span>}>
              <CurrentCrumb />
            </Suspense>
          </nav>
          <div className="flex items-center gap-4">
            <NotificationBell variant="admin" />
            <span aria-hidden className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-sm">
                {initials(a?.fullName)}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">{a?.fullName ?? "Cộng tác viên"}</p>
                <p className="text-xs text-gray-500">{a?.referralCode ? `Mã ${a.referralCode}` : "Cộng tác viên HWIN"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Thanh trên – mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            aria-expanded={open}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="size-5" />
          </button>
          <PortalLink slug="dashboard" className="flex-1 text-base font-extrabold tracking-tight text-brand-deep">
            HWIN <span className="text-brand-red">Affiliate</span>
          </PortalLink>
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {initials(a?.fullName)}
          </span>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Ngăn kéo menu – mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu cộng tác viên">
          <button aria-label="Đóng menu" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />
          <div className="relative h-full w-72 max-w-[85vw] shadow-xl animate-in slide-in-from-left duration-200">
            <Sidebar profile={a} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Tên mục hiện tại; đọc pathname nên nằm trong Suspense (URL có id động). */
function CurrentCrumb() {
  const slug = activeSlug(usePathname());
  const label = PORTAL_NAV.find((n) => n.slug === slug)?.label ?? "Tổng quan";
  return <span className="font-semibold text-gray-800">{label}</span>;
}
