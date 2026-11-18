import { Suspense } from "react";

import { OwnIdRedirect } from "@/components/own-id-redirect";
import { PORTAL_SLUGS } from "@/lib/portal-path";

/**
 * Mọi trang cổng CTV nằm dưới /affiliate/<id tài khoản>/…. Id chỉ để hiển thị: dữ liệu lấy theo phiên đăng nhập,
 * link cũ (/affiliate/links) hoặc id của người khác sẽ được chuyển sang id của chính người đang đăng nhập.
 */
export default function PortalIdLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <OwnIdRedirect base="/affiliate" slugs={PORTAL_SLUGS} fallbackTail="dashboard" />
      </Suspense>
      {children}
    </>
  );
}
