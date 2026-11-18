import type { Metadata } from "next";

import { ComingSoon } from "@/components/affiliate/portal/coming-soon";

export const metadata: Metadata = { title: "Link Affiliate" };

export default function AffiliateLinksPage() {
  return <ComingSoon href="/affiliate/links" />;
}
