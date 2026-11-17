"use client";

import { useQuery } from "@tanstack/react-query";

import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";
import type { AffiliateResponse } from "@/lib/affiliate";

/** Mã giới thiệu của CTV đã duyệt đang đăng nhập; null nếu không phải CTV. */
export function useAffiliateCode(): string | null {
  const me = useMe();
  const isAffiliate = !!me.data?.roles.includes("AFFILIATE");
  const profile = useQuery({
    queryKey: ["affiliate-me"],
    queryFn: () => api<AffiliateResponse>("/api/affiliates/me"),
    enabled: isAffiliate,
    staleTime: 5 * 60_000,
  });
  return isAffiliate && profile.data?.status === "APPROVED" ? profile.data.referralCode : null;
}
