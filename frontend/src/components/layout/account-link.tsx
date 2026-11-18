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
    <Link href={href} className="group/acc hidden items-center gap-2 text-sm text-neutral-700 md:flex">
      <span className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition duration-200 group-hover/acc:bg-brand-soft group-hover/acc:text-brand">
        <UserRound className="size-5" />
      </span>
      <span className="hidden max-w-36 leading-tight xl:block">
        <span className="block truncate font-semibold text-neutral-900">{name ?? "Đăng nhập"}</span>
        <span className="text-xs text-muted-foreground">{user?.roles?.includes("ADMIN") ? "Quản trị" : "Tài khoản"}</span>
      </span>
    </Link>
  );
}
