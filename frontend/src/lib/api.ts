"use client";

/**
 * Gọi API backend từ trình duyệt (qua rewrite /api/* của Next.js -> cookie JWT là first-party).
 * Gặp 401 thì thử làm mới phiên (POST /api/auth/refresh) đúng 1 lần rồi gọi lại.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Gộp các lời gọi refresh đồng thời thành một (refresh token xoay vòng, gọi 2 lần sẽ bị thu hồi). */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refreshing = null), 0));
  return refreshing;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}, retry = true): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 401 && retry && (path === "/api/auth/me" || !path.startsWith("/api/auth/"))) {
    if (await refreshSession()) return api<T>(path, init, false);
  }
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    const fieldErrors = Array.isArray(p.errors) ? p.errors : [];
    // Định dạng lỗi backend: { messageCode, message, errors: [{ field, message }], details }
    const message = fieldErrors[0]?.message ?? p.message ?? "Có lỗi xảy ra, vui lòng thử lại";
    throw new ApiError(res.status, p.messageCode, message, fieldErrors);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại");
