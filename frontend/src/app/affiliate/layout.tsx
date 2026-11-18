import type { Metadata } from "next";

import { PortalShell } from "@/components/affiliate/portal/portal-shell";

export const metadata: Metadata = {
  title: { default: "Cổng cộng tác viên", template: "%s | HWIN Affiliate" },
  robots: { index: false },
};

/** Cổng CTV (/affiliate/dashboard, /campaigns…): khung riêng có sidebar, không dùng header/footer cửa hàng. */
export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
