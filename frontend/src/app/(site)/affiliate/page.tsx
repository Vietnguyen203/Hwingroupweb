import type { Metadata } from "next";

import { AffiliateHome } from "@/components/affiliate/affiliate-home";

export const metadata: Metadata = { title: "Cộng tác viên", description: "Chương trình cộng tác viên HWIN – hoa hồng 10% mỗi đơn." };

export default function AffiliatePage() {
  return <AffiliateHome />;
}
