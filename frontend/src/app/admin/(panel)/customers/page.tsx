import type { Metadata } from "next";

import { AdminCustomers } from "@/components/admin/admin-customers";

export const metadata: Metadata = { title: "Khách hàng" };

export default function Page() {
  return <AdminCustomers />;
}
