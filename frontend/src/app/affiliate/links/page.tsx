import type { Metadata } from "next";

import { AffiliateLinks } from "@/components/affiliate/portal/links-page";

export const metadata: Metadata = { title: "Link Affiliate" };

export default function AffiliateLinksPage() {
  return <AffiliateLinks />;
}
