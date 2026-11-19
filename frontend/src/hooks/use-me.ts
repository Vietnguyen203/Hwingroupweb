"use client";

import { useQuery } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { MeResponse } from "@/lib/account";

/** Người dùng đang đăng nhập; null nếu chưa đăng nhập (401). */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<MeResponse>("/api/auth/me"); // api() tự làm mới phiên khi gặp 401
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}

/**
 * Người dùng đang đăng nhập để HIỂN THỊ (header, chuông thông báo, nút CTV, trang đăng nhập).
 * react-query giữ lại người dùng cũ khi lần kiểm tra gần nhất bị lỗi (backend tắt / 5xx), nên header có thể vẫn ghi tên
 * dù phiên đã không còn xác nhận được -> coi như chưa biết (undefined) thay vì hiện là đã đăng nhập.
 */
export function useSignedInUser(): MeResponse | null | undefined {
  const me = useMe();
  return me.isError ? undefined : me.data;
}
