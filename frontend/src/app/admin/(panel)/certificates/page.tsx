import type { Metadata } from "next";

import { AdminCertificates } from "@/components/admin/admin-certificates";

export const metadata: Metadata = {
  title: "Quản lý Giấy chứng nhận VSATTP & Pháp lý | HWIN Admin",
};

export default function AdminCertificatesPage() {
  return <AdminCertificates />;
}
