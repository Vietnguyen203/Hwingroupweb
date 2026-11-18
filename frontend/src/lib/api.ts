"use client";

import { translateError } from "./error-messages";

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
    // Lỗi từng trường: câu validator đã là tiếng Việt. Lỗi nghiệp vụ: dịch theo mã lỗi (enum) sang tiếng Việt;
    // câu tiếng Anh của backend dành cho log / lập trình viên, chỉ hiện khi mã chưa có bản dịch.
    const message = fieldErrors[0]?.message ?? translateError(p.messageCode, p.details) ?? p.message ?? "Có lỗi xảy ra, vui lòng thử lại";
    throw new ApiError(res.status, p.messageCode, message, fieldErrors);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const ERROR_CODE_LABELS: Record<string, string> = {
  INVALID_LOGIN: "Email / Số điện thoại hoặc mật khẩu không chính xác.",
  BAD_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không đúng.",
  ACCOUNT_NOT_FOUND: "Tài khoản không tồn tại, vui lòng đăng ký.",
  ACCOUNT_EXISTS: "Tài khoản đã tồn tại, vui lòng đăng nhập.",
  LOGIN_LOCKED: "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau ít phút.",
  OTP_INVALID: "Mã OTP không đúng, vui lòng kiểm tra lại.",
  OTP_EXPIRED: "Mã OTP đã hết hạn, vui lòng gửi lại mã mới.",
  OTP_LOCKED: "Nhập sai OTP quá số lần cho phép, vui lòng thử lại sau.",
  UNAUTHORIZED: "Vui lòng đăng nhập để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  RATE_LIMITED: "Thao tác quá nhanh, vui lòng thử lại sau ít phút.",
};

export const errorMessage = (e: unknown) => {
  if (e instanceof ApiError && e.code && ERROR_CODE_LABELS[e.code]) {
    return ERROR_CODE_LABELS[e.code];
  }
  return e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại";
};
