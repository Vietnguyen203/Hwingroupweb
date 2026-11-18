import { Suspense } from "react";
import type { Metadata } from "next";

import { AccountView } from "@/components/account/account-view";
import { OwnIdRedirect } from "@/components/own-id-redirect";

export const metadata: Metadata = { title: "Tài khoản của tôi", robots: { index: false } };

/**
 * /account/<id tài khoản>. Id chỉ để hiển thị: dữ liệu lấy theo phiên đăng nhập, id của người khác
 * sẽ được chuyển sang id của chính người đang đăng nhập (OwnIdRedirect).
 */
export default function AccountByIdPage() {
  return (
    <>
      <AccountView />
      <Suspense fallback={null}>
        <OwnIdRedirect base="/account" />
      </Suspense>
    </>
  );
}
