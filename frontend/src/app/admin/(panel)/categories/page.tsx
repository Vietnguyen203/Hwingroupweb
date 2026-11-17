import type { Metadata } from "next";

import { AdminCategories } from "@/components/admin/admin-categories";

export const metadata: Metadata = { title: "Danh mục sản phẩm" };

export default function CategoriesPage() {
  return <AdminCategories />;
}
