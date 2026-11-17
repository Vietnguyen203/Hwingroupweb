import type { Metadata } from "next";

import { AdminPayouts } from "@/components/admin/admin-payouts";

export const metadata: Metadata = { title: "Rút tiền" };

export default function Page() {
  return <AdminPayouts />;
}
