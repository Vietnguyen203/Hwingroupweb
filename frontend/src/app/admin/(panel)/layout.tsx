import { Suspense } from "react";
import { AdminSidebarContent, AdminNav } from "@/components/admin/admin-shell";

/**
 * Khung trang quản trị hiện đại, diện tích rộng rãi (full-screen wide)
 * Cột menu cố định bên trái (Desktop w-64), thanh trạng thái phía trên và khu vực bảng dữ liệu thoáng đãng.
 */
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 antialiased">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block shadow-md">
        <Suspense fallback={<div className="h-full w-64 bg-slate-900" />}>
          <AdminSidebarContent />
        </Suspense>
      </aside>

      {/* Main Workspace */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top Header Bar */}
        <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
          <AdminNav />
        </Suspense>

        {/* Spacious Data Content Area */}
        <main className="w-full max-w-[1720px] flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
