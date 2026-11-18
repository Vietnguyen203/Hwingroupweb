"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgePercent,
  Boxes,
  ChevronRight,
  ExternalLink,
  FolderTree,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const NAV_GROUPS = [
  {
    title: "Quản lý kinh doanh",
    items: [
      { href: "/admin/orders", label: "Đơn hàng", icon: Package },
      { href: "/admin/products", label: "Sản phẩm", icon: Boxes },
      { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
      { href: "/admin/certificates", label: "Chứng nhận & ATTP", icon: ShieldCheck },
      { href: "/admin/customers", label: "Khách hàng", icon: Users },
      { href: "/admin/reviews", label: "Đánh giá", icon: MessageSquareText },
    ],
  },
  {
    title: "Chương trình đối tác",
    items: [
      { href: "/admin/affiliates", label: "Đối tác CTV", icon: UserRoundCheck },
      { href: "/admin/commissions", label: "Hoa hồng", icon: BadgePercent },
      { href: "/admin/payouts", label: "Yêu cầu rút tiền", icon: Wallet },
    ],
  },
];

const PAGE_NAMES: Record<string, string> = {
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/products": "Quản lý sản phẩm",
  "/admin/categories": "Quản lý danh mục sản phẩm",
  "/admin/certificates": "Quản lý chứng nhận & VSATTP",
  "/admin/customers": "Quản lý khách hàng",
  "/admin/reviews": "Kiểm duyệt đánh giá sản phẩm",
  "/admin/affiliates": "Quản lý đối tác CTV",
  "/admin/commissions": "Báo cáo hoa hồng",
  "/admin/payouts": "Yêu cầu thanh toán & rút tiền",
};

/** Sidebar chính dành riêng cho Admin trên Desktop */
export function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    qc.clear();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <Link href="/admin/orders" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-rose-500 font-black text-white shadow-md shadow-brand/20">
            H
          </div>
          <div>
            <div className="text-base font-extrabold tracking-wide text-white">HWIN GROUP</div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="size-3 text-emerald-400" /> Quản trị viên
            </div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-brand font-semibold text-white shadow-md shadow-brand/20"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          "size-4.5 transition-colors",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="size-4 text-white/80" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Footer Area */}
      <div className="border-t border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="size-3.5 text-slate-400" />
            Xem trang bán hàng
          </span>
          <span className="text-[10px] text-slate-400">Mở tab mới ↗</span>
        </a>

        {/* Current user & Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 font-bold text-xs text-brand">
              AD
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Quản trị viên</div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Đang hoạt động
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-950/40 hover:text-rose-400"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Header thanh điều hướng trên cùng của trang Admin */
export function AdminHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  const currentTitle =
    Object.entries(PAGE_NAMES).find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "Bảng điều khiển quản trị";

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    qc.clear();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden font-medium text-slate-400 sm:inline text-sm">Quản trị</span>
          <ChevronRight className="hidden size-4 text-slate-300 sm:inline" />
          <h2 className="text-base font-bold text-slate-800 sm:text-lg">{currentTitle}</h2>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
        >
          <ExternalLink className="size-3.5" />
          <span>Xem website</span>
        </a>

        <NotificationBell variant="admin" />

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            AD
          </div>
          <span className="hidden text-xs font-medium text-slate-600 md:inline">admin</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Tương thích ngược với các file cũ import AdminNav */
export function AdminNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AdminHeader onOpenMobileMenu={() => setOpen(true)} />
      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-72 max-w-[80vw]">
            <AdminSidebarContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
