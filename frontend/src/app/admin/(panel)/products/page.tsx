import type { Metadata } from "next";

import { AdminProducts } from "@/components/admin/admin-products";

export const metadata: Metadata = { title: "Sản phẩm" };

export default function Page() {
  return <AdminProducts />;
}
