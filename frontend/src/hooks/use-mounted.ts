"use client";

import { useSyncExternalStore } from "react";

/** true sau khi hydrate xong – tránh lệch HTML server/client với dữ liệu localStorage. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
