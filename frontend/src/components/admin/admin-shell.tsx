"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Boxes, LogOut, Package, Users, UserRoundCheck, Wallet } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/orders", label: "Đơn hàng", icon: Package },
  { href: "/admin/products", label: "Sản phẩm", icon: Boxes },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/affiliates", label: "CTV", icon: UserRoundCheck },
  { href: "/admin/commissions", label: "Hoa hồng", icon: BadgePercent },
  { href: "/admin/payouts", label: "Rút tiền", icon: Wallet },
];

/** Menu trang quản trị: cột trái (desktop) / thanh cuộn ngang (mobile). */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    qc.clear();
    router.replace("/admin/login");
  }

  return (
    <nav className="no-scrollbar mb-3 flex gap-1 overflow-x-auto md:mb-0 md:w-48 md:shrink-0 md:flex-col">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href}
              className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm",
                pathname.startsWith(n.href) ? "bg-brand text-white" : "bg-white hover:bg-brand-soft")}>
          <n.icon className="size-4" /> {n.label}
        </Link>
      ))}
      <button onClick={logout} className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-muted-foreground md:mt-4">
        <LogOut className="size-4" /> Đăng xuất
      </button>
    </nav>
  );
}
