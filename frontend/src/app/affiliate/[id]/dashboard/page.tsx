import type { Metadata } from "next";

import { Overview } from "@/components/affiliate/portal/overview";
import { PortalGate } from "@/components/affiliate/portal/portal-gate";

export const metadata: Metadata = { title: "Tổng quan" };

export default function AffiliateDashboardPage() {
  return (
    <PortalGate>
      <Overview />
    </PortalGate>
  );
}
