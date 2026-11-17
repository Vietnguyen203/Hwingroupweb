import { Suspense } from "react";
import type { Metadata } from "next";

import { OrderDetailView } from "@/components/account/order-detail";
import { OrderDetailSkeleton } from "@/components/skeletons/page-skeletons";

export const metadata: Metadata = { title: "Chi tiết đơn hàng", robots: { index: false } };

export default function OrderPage(props: PageProps<"/account/orders/[code]">) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/account/orders/[code]">) {
  const { code } = await params;
  return <OrderDetailView code={decodeURIComponent(code)} />;
}
