"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { initials } from "@/lib/affiliate-stats";
import { Sidebar } from "./sidebar";

/**
 * Khung cổng CTV: sidebar cố định bên trái (desktop) hoặc thanh trên + ngăn kéo (mobile), nội dung bên phải nền xám nhạt.
 * Luôn render `children`; việc chỉ cho CTV đã duyệt xem nội dung do PortalGate ở từng trang đảm nhiệm.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAffiliateProfile({ syncRole: false }); // chỉ đọc tên cho sidebar; PortalGate lo làm mới phiên
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Điều hướng xong thì đóng ngăn kéo (chỉnh state ngay khi render, không cần effect)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

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

  const a = profile.data;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar cố định – desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 lg:block">
        <Sidebar profile={a} />
      </aside>

      <div className="lg:pl-64">
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
          <Link href="/affiliate/dashboard" className="flex-1 text-base font-extrabold tracking-tight text-brand-deep">
            HWIN <span className="text-brand-red">Affiliate</span>
          </Link>
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
