import type { Metadata } from "next";

import { AdminReviews } from "@/components/admin/admin-reviews";

export const metadata: Metadata = { title: "Đánh giá sản phẩm" };

export default function Page() {
  return <AdminReviews />;
}
