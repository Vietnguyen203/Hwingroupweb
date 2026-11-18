import { Suspense } from "react";
import type { Metadata } from "next";

import { Earnings } from "@/components/affiliate/portal/earnings-page";
import { PortalGate, PortalSkeleton } from "@/components/affiliate/portal/portal-gate";

export const metadata: Metadata = { title: "Hoa hồng & Thanh toán" };

export default function AffiliateEarningsPage() {
  return (
    <PortalGate>
      {/* useSearchParams (đọc ?tab=) cần Suspense khi prerender */}
      <Suspense fallback={<PortalSkeleton />}>
        <Earnings />
      </Suspense>
    </PortalGate>
  );
}
