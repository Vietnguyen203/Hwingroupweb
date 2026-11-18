import type { Metadata } from "next";

import { PortalGate, PortalSkeleton } from "@/components/affiliate/portal/portal-gate";

export const metadata: Metadata = { title: "Cổng cộng tác viên" };

/** /affiliate/<id> (hoặc link cũ /affiliate/<mục>): chỉ hiện khung chờ, OwnIdRedirect ở layout chuyển tới đúng mục. */
export default function PortalIdPage() {
  return (
    <PortalGate>
      <PortalSkeleton />
    </PortalGate>
  );
}
