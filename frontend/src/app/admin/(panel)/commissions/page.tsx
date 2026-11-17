import type { Metadata } from "next";

import { AdminCommissions } from "@/components/admin/admin-commissions";

export const metadata: Metadata = { title: "Hoa hồng" };

export default function Page() {
  return <AdminCommissions />;
}
