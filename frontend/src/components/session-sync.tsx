"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useMe } from "@/hooks/use-me";
import { syncCartForUser } from "@/lib/cart-sync";

/**
 * Chạy ngầm trên mọi trang:
 * - Đồng bộ giỏ hàng theo trạng thái đăng nhập.
 * - Mở link có ?ref=MÃ_CTV -> ghi nhận click (backend đặt cookie hwin_ref 30 ngày). Mỗi mã 1 lần / phiên tab.
 *   Link có thêm ?src=facebook|zalo|tiktok|youtube|instagram thì gửi kèm để thống kê click theo nền tảng.
 */
export function SessionSync() {
  const me = useMe();
  const params = useSearchParams();
  const ref = params.get("ref");
  const rawSource = params.get("src");

  useEffect(() => {
    if (me.isPending) return;
    // giỏ hàng chỉ dành cho khách (admin không có vai trò CUSTOMER)
    const customerId = me.data?.roles.includes("CUSTOMER") ? me.data.id : null;
    syncCartForUser(customerId).catch(() => undefined);
  }, [me.isPending, me.data]);

  useEffect(() => {
    if (!ref || !/^[A-Za-z0-9_-]{3,32}$/.test(ref)) return;
    const source = rawSource && /^[A-Za-z0-9_-]{1,32}$/.test(rawSource) ? rawSource : undefined;
    const key = `hwin-ref-${ref.toUpperCase()}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* bỏ qua */ }
    fetch("/api/referral-clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref, landingPath: location.pathname, source }),
    }).catch(() => undefined);
  }, [ref, rawSource]);

  return null;
}
