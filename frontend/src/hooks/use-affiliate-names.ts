"use client";

import { useQueries } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PageResponse } from "@/lib/types";

type AffiliateLookup = { fullName: string; referralCode: string | null };

/**
 * Tên CTV theo mã giới thiệu (cho trang admin: cột CTV của đơn hàng).
 * Dùng API admin có sẵn GET /api/admin/affiliates?q=<mã> (q khớp đúng mã giới thiệu); mỗi mã tra một lần và được nhớ 10 phút.
 * Mã chưa tra xong hoặc không tìm thấy thì không có trong kết quả – nơi dùng hiển thị mã.
 */
export function useAffiliateNames(codes: (string | null | undefined)[]): Record<string, string> {
  const unique = [...new Set(codes.filter((c): c is string => !!c))];
  const results = useQueries({
    queries: unique.map((code) => ({
      queryKey: ["admin", "affiliate-name", code],
      queryFn: async () => {
        const page = await api<PageResponse<AffiliateLookup>>(`/api/admin/affiliates?q=${encodeURIComponent(code)}&page_size=5`);
        return page.content.find((a) => a.referralCode === code)?.fullName ?? null;
      },
      staleTime: 10 * 60_000,
    })),
  });

  const names: Record<string, string> = {};
  unique.forEach((code, i) => {
    const name = results[i]?.data;
    if (name) names[code] = name;
  });
  return names;
}
