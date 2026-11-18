import type { Metadata } from "next";

import { ComingSoon } from "@/components/affiliate/portal/coming-soon";

export const metadata: Metadata = { title: "Hiệu suất" };

export default function AffiliatePerformancePage() {
  return <ComingSoon slug="performance" />;
}
