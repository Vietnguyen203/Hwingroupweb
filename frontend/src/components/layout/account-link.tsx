"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

export interface AccountLinkProps {
  vertical?: boolean;
  className?: string;
}

/** Nút tài khoản trên header desktop: "Đăng nhập" hoặc tên / email người dùng. */
export function AccountLink({ vertical = true, className }: AccountLinkProps) {
  const mounted = useMounted();
  const me = useMe().data;
  const user = mounted ? me : null;
  const name = user ? user.fullName || user.email || user.phoneMasked || "Tài khoản" : null;
  const href = user?.roles?.includes("ADMIN") ? "/admin/orders" : user ? "/account" : "/login";

  if (vertical) {
    return (
      <Link
        href={href}
        className={cn(
          "group hidden flex-col items-center gap-1 text-neutral-700 transition hover:text-brand md:flex",
          className
        )}
      >
        <UserRound className="size-6 transition-transform group-hover:scale-110" />
        <span className="max-w-20 truncate text-[11px] font-medium leading-none text-neutral-600 group-hover:text-brand">
          {name ?? "Tài khoản"}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("hidden items-center gap-2 rounded-full p-2 text-sm text-gray-800 transition-colors hover:bg-gray-100 md:flex xl:pr-4", className)}>
      <UserRound className="size-6" />
      <span className="hidden max-w-36 leading-tight xl:block">
        <span className="block truncate font-semibold text-neutral-900">{name ?? "Đăng nhập"}</span>
        <span className="text-xs text-muted-foreground">{user?.roles?.includes("ADMIN") ? "Quản trị" : "Tài khoản"}</span>
      </span>
    </Link>
  );
}
