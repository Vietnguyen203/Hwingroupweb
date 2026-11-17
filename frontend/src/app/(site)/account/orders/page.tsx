import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { OrdersCard } from "@/components/account/account-view";

export const metadata: Metadata = { title: "Đơn hàng của tôi", robots: { index: false } };

/** Danh sách đơn hàng của khách (50 đơn gần nhất). */
export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-3 md:py-6">
      <Link href="/account" className="flex items-center gap-1 text-sm text-brand-link"><ArrowLeft className="size-4" /> Tài khoản</Link>
      <OrdersCard pageSize={50} />
    </div>
  );
}
