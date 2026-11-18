"use client";

import Link from "next/link";

import { useAffiliateCode } from "@/hooks/use-affiliate-code";
import { useMounted } from "@/hooks/use-mounted";

/** true khi người xem là CTV đã duyệt. Lần render đầu (hydrate) luôn false để khớp HTML server. */
function useIsAffiliate() {
  const code = useAffiliateCode();
  const mounted = useMounted();
  return mounted && !!code;
}

/** Nút mời làm CTV: khách thấy lời mời đăng ký, CTV đã duyệt thấy lối vào cổng CTV. */
export function AffiliateJoinLink({ className, guestLabel, guestHref = "/affiliate" }: { className?: string; guestLabel: string; guestHref?: string }) {
  const member = useIsAffiliate();
  return (
    <Link href={member ? "/affiliate/dashboard" : guestHref} className={className}>
      {member ? "Vào cổng CTV" : guestLabel}
    </Link>
  );
}

/** Chỉ hiện cho khách / người chưa là CTV (CTV đã duyệt không cần thấy lời mời đăng ký). */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  return useIsAffiliate() ? null : children;
}
