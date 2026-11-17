import { Suspense } from "react";
import type { Metadata } from "next";

import { OrderDetailView } from "@/components/account/order-detail";

export const metadata: Metadata = { title: "Chi tiết đơn hàng", robots: { index: false } };

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="m-3 h-64 animate-pulse rounded-2xl bg-neutral-200" />}>
      <OrderDetailView />
    </Suspense>
  );
}
