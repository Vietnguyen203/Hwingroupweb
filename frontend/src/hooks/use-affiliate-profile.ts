"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useMe } from "@/hooks/use-me";
import { api, ApiError } from "@/lib/api";
import type { AffiliateResponse } from "@/lib/affiliate";

/**
 * Hồ sơ CTV của người đang đăng nhập (data = null nghĩa là chưa đăng ký CTV).
 * Nếu hồ sơ vừa được duyệt mà phiên cũ chưa có vai trò AFFILIATE thì tự làm mới phiên để nhận vai trò;
 * `needsRole` = true trong lúc chờ làm mới – nơi gọi nên hiện skeleton thay vì gọi API CTV.
 *
 * Refresh token xoay vòng nên chỉ MỘT nơi trên màn hình được làm mới phiên (AffiliateHome, PortalGate);
 * các nơi chỉ đọc hồ sơ (sidebar, trang con) phải truyền `syncRole: false`.
 */
export function useAffiliateProfile({ syncRole = true }: { syncRole?: boolean } = {}) {
  const me = useMe();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["affiliate-me"],
    queryFn: async () => {
      try {
        return await api<AffiliateResponse>("/api/affiliates/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null; // chưa đăng ký CTV
        throw e;
      }
    },
    enabled: !!me.data,
  });

  const needsRole = profile.data?.status === "APPROVED" && !!me.data && !me.data.roles.includes("AFFILIATE");
  useEffect(() => {
    if (!syncRole || !needsRole) return;
    fetch("/api/auth/refresh", { method: "POST" }).finally(() => qc.invalidateQueries({ queryKey: ["me"] }));
  }, [syncRole, needsRole, qc]);

  return { me, profile, needsRole };
}
