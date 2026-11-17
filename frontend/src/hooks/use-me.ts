"use client";

import { useQuery } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { Me } from "@/lib/account";

/** Người dùng đang đăng nhập; null nếu chưa đăng nhập (401). */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<Me>("/api/auth/me"); // api() tự làm mới phiên khi gặp 401
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}
