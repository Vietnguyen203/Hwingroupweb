import type { Metadata } from "next";

import { AffiliateLinks } from "@/components/affiliate/portal/links-page";
import { PortalGate } from "@/components/affiliate/portal/portal-gate";

export const metadata: Metadata = { title: "Link Affiliate" };

export default function AffiliateLinksPage() {
  return (
    <PortalGate>
      <AffiliateLinks />
    </PortalGate>
  );
}
