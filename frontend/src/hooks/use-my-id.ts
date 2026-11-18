"use client";

import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";

/** ID tài khoản đang đăng nhập; undefined trước khi mount (khớp HTML server) hoặc khi chưa đăng nhập. */
export function useMyId(): string | undefined {
  const mounted = useMounted();
  const me = useMe().data;
  return mounted ? me?.id : undefined;
}
