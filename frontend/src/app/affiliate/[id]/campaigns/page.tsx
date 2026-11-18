import type { Metadata } from "next";

import { ComingSoon } from "@/components/affiliate/portal/coming-soon";

export const metadata: Metadata = { title: "Chiến dịch" };

export default function AffiliateCampaignsPage() {
  return <ComingSoon slug="campaigns" />;
}
