import type { Metadata } from "next";

import { Performance } from "@/components/affiliate/portal/performance";
import { PortalGate } from "@/components/affiliate/portal/portal-gate";

export const metadata: Metadata = { title: "Hiệu suất" };

export default function AffiliatePerformancePage() {
  return (
    <PortalGate>
      <Performance />
    </PortalGate>
  );
}
