import type { Metadata } from "next";

import { ComingSoon } from "@/components/affiliate/portal/coming-soon";

export const metadata: Metadata = { title: "Hoa hồng & Thanh toán" };

export default function AffiliateEarningsPage() {
  return <ComingSoon href="/affiliate/earnings" />;
}
