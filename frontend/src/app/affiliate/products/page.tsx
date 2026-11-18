import type { Metadata } from "next";

import { ComingSoon } from "@/components/affiliate/portal/coming-soon";

export const metadata: Metadata = { title: "Sản phẩm" };

export default function AffiliateProductsPage() {
  return <ComingSoon href="/affiliate/products" />;
}
