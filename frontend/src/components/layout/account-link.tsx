"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { useMe } from "@/hooks/use-me";

/** Nút tài khoản trên header desktop: "Đăng nhập" hoặc tên / email người dùng. */
export function AccountLink() {
  const me = useMe().data;
  const name = me ? me.fullName || me.email || me.phoneMasked || "Tài khoản" : null;
  return (
    <Link href={me ? "/account" : "/login"} className="hidden items-center gap-1.5 text-sm text-neutral-700 md:flex">
      <UserRound className="size-6" />
      <span className="hidden max-w-36 leading-tight xl:block">
        <span className="block truncate">{name ?? "Đăng nhập"}</span>
        <span className="text-xs text-muted-foreground">Tài khoản</span>
      </span>
    </Link>
  );
}
