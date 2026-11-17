import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-shell";

/** Khung trang quản trị (trừ /admin/login): menu + nội dung. Chỉ menu cần Suspense (đọc pathname). */
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gap-4 p-3 md:flex md:py-6">
      <Suspense fallback={<div className="mb-3 h-10 md:w-48 md:shrink-0" />}>
        <AdminNav />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
