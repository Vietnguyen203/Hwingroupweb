import { Suspense } from "react";
import type { Metadata } from "next";

import { AccountView } from "@/components/account/account-view";
import { OwnIdRedirect } from "@/components/own-id-redirect";

export const metadata: Metadata = { title: "Tài khoản của tôi", robots: { index: false } };

/** /account: đã đăng nhập thì chuyển sang /account/<id tài khoản> (OwnIdRedirect); khách được AccountView đưa tới trang đăng nhập. */
export default function AccountPage() {
  return (
    <>
      <AccountView />
      <Suspense fallback={null}>
        <OwnIdRedirect base="/account" />
      </Suspense>
    </>
  );
}
