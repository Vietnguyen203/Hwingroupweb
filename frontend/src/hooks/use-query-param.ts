"use client";

import { useSyncExternalStore } from "react";

/**
 * Đọc một tham số trên URL hiện tại ở client. Server / lúc hydrate trả null (không lệch HTML), sau đó trả giá trị thật.
 * Dùng thay useSearchParams cho trang không muốn phải bọc Suspense (Cache Components).
 */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}
