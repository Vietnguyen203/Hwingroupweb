import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminOrderDetail } from "@/components/admin/admin-order-detail";

export const metadata: Metadata = { title: "Chi tiết đơn" };

export default function Page(props: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  return <AdminOrderDetail id={id} />;
}
