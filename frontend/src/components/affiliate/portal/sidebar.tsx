"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, X } from "lucide-react";

import { api } from "@/lib/api";
import type { AffiliateResponse } from "@/lib/affiliate";
import { initials } from "@/lib/affiliate-stats";
import { activeSlug, type PortalSlug } from "@/lib/portal-path";
import { cn } from "@/lib/utils";
import { PORTAL_NAV } from "./nav";
import { PortalLink } from "./portal-link";

/**
 * Nội dung sidebar cổng CTV: logo, 6 mục điều hướng, khối người dùng + đăng xuất ở đáy.
 * Dùng chung cho cột cố định (desktop) và ngăn kéo (mobile) – `onClose` chỉ truyền ở ngăn kéo.
 */
export function Sidebar({ profile, onClose }: { profile: AffiliateResponse | null | undefined; onClose?: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    qc.clear();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <PortalLink slug="dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-accent text-base font-black text-white shadow-sm">
            H
          </span>
          <span className="text-lg font-extrabold tracking-tight text-brand-deep">
            HWIN <span className="text-brand-red">Affiliate</span>
          </span>
        </PortalLink>
        {onClose && (
          <button onClick={onClose} aria-label="Đóng menu" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* usePathname chỉ biết khi có request (URL có id động) nên nằm trong Suspense; fallback là menu chưa tô mục đang mở */}
      <Suspense fallback={<NavList active={null} onClose={onClose} />}>
        <ActiveNavList onClose={onClose} />
      </Suspense>

      <div className="shrink-0 space-y-2 border-t border-gray-100 p-3">
        <Link
          href="/"
          onClick={onClose}
          className="group flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          Về trang bán hàng
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand"
          >
            {initials(profile?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{profile?.fullName ?? "Cộng tác viên"}</p>
            <p className="truncate text-xs text-gray-500">
              {profile?.referralCode ? `Mã ${profile.referralCode}` : "Cộng tác viên HWIN"}
            </p>
          </div>
          <button
            onClick={logout}
            disabled={leaving}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="size-4.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveNavList({ onClose }: { onClose?: () => void }) {
  return <NavList active={activeSlug(usePathname())} onClose={onClose} />;
}

function NavList({ active, onClose }: { active: PortalSlug | null; onClose?: () => void }) {
  return (
    <nav aria-label="Menu cộng tác viên" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {PORTAL_NAV.map((item) => {
        const isActive = item.slug === active;
        return (
          <PortalLink
            key={item.slug}
            slug={item.slug}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150",
              isActive
                ? "bg-brand-red/10 font-semibold text-brand-red before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-brand-red"
                : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <item.icon className="size-5 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </PortalLink>
        );
      })}
    </nav>
  );
}
