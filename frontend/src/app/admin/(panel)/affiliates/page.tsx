import type { Metadata } from "next";

import { AdminAffiliates } from "@/components/admin/admin-affiliates";

export const metadata: Metadata = { title: "Cộng tác viên" };

export default function Page() {
  return <AdminAffiliates />;
}
