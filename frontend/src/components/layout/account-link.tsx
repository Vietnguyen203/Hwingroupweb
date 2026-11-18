"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";

/** Nút tài khoản trên header desktop: "Đăng nhập" hoặc tên / email người dùng. */
export function AccountLink() {
  // Lần render đầu (hydrate) luôn là trạng thái chưa đăng nhập để khớp HTML server; sau đó mới hiện dữ liệu thật.
  const mounted = useMounted();
  const me = useMe().data;
  const user = mounted ? me : null;
  const name = user ? user.fullName || user.email || user.phoneMasked || "Tài khoản" : null;
  const href = user?.roles?.includes("ADMIN") ? "/admin/orders" : user ? "/account" : "/login";
  return (
    <Link href={href} className="hidden items-center gap-2 rounded-full p-2 text-sm text-gray-800 transition-colors hover:bg-gray-100 md:flex xl:pr-4">
      <UserRound className="size-6" />
      <span className="hidden max-w-36 leading-tight xl:block">
        <span className="block truncate font-semibold text-neutral-900">{name ?? "Đăng nhập"}</span>
        <span className="text-xs text-muted-foreground">{user?.roles?.includes("ADMIN") ? "Quản trị" : "Tài khoản"}</span>
      </span>
    </Link>
  );
}
