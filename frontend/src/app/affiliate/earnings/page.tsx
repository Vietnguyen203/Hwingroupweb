import { Suspense } from "react";
import type { Metadata } from "next";

import { Earnings } from "@/components/affiliate/portal/earnings-page";

export const metadata: Metadata = { title: "Hoa hồng & Thanh toán" };

export default function AffiliateEarningsPage() {
  // useSearchParams (đọc ?tab=) cần Suspense khi prerender
  return (
    <Suspense fallback={null}>
      <Earnings />
    </Suspense>
  );
}
