"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD, type OrderDetail } from "@/lib/account";
import { formatVnd } from "@/lib/format";

/** Chi tiết một đơn của khách; đơn PENDING có nút hủy. */
export function OrderDetailView() {
  const { code } = useParams<{ code: string }>();
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["order", code],
    queryFn: () => api<OrderDetail>(`/api/orders/${encodeURIComponent(code)}`),
  });
  const cancel = useMutation({
    mutationFn: () => api<OrderDetail>(`/api/orders/${encodeURIComponent(code)}/cancel`, { method: "POST" }),
    onSuccess: (o) => {
      qc.setQueryData(["order", code], o);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const back = (
    <Link href="/account" className="flex items-center gap-1 text-sm text-brand-link"><ArrowLeft className="size-4" /> Tài khoản</Link>
  );

  if (order.isPending) return <div className="m-3 h-64 animate-pulse rounded-2xl bg-neutral-200" />;
  if (order.error) {
    const msg = order.error instanceof ApiError && order.error.status === 401
      ? <>Vui lòng <Link href={`/login?next=/account/orders/${code}`} className="text-brand-link">đăng nhập</Link>.</>
      : errorMessage(order.error);
    return <div className="space-y-3 p-3">{back}<p className="rounded-2xl bg-white p-4 text-sm">{msg}</p></div>;
  }

  const o = order.data;
  const st = ORDER_STATUS[o.status];
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-3 md:py-6">
      {back}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand">Đơn {o.code}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs ${st.className}`}>{st.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">Đặt lúc {formatDateTime(o.placedAt)}</p>
        <p className="mt-2 text-sm">{PAYMENT_METHOD[o.paymentMethod] ?? o.paymentMethod} · {o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</p>
      </section>

      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <h2 className="mb-1 font-bold">Giao tới</h2>
        <p className="font-medium">{o.shippingAddress.recipientName} · {o.shippingAddress.recipientPhone}</p>
        <p className="text-muted-foreground">{o.shippingAddress.fullText}</p>
        {o.note && <p className="mt-1 text-muted-foreground">Ghi chú: {o.note}</p>}
      </section>

      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <ul className="divide-y">
          {o.items.map((i) => (
            <li key={i.productId} className="flex gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.imageUrl ? <img src={i.imageUrl} alt="" className="size-14 rounded-lg object-cover" /> : <div className="size-14 rounded-lg bg-neutral-100" />}
              <div className="flex-1">
                <Link href={`/p/${i.productSlug}`} className="line-clamp-2 font-medium">{i.productName}</Link>
                <p className="text-muted-foreground">{formatVnd(i.unitPrice)} × {i.quantity}</p>
              </div>
              <span className="font-semibold">{formatVnd(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1 border-t pt-2">
          <Row label="Tạm tính" value={formatVnd(o.subtotal)} />
          {o.discount > 0 && <Row label="Giảm giá" value={`-${formatVnd(o.discount)}`} />}
          <Row label="Phí giao hàng" value={formatVnd(o.shippingFee)} />
          <div className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-brand-red">{formatVnd(o.total)}</span></div>
        </div>
      </section>

      {o.cancellable && (
        <Button
          variant="destructive"
          disabled={cancel.isPending}
          className="h-11 w-full"
          onClick={() => { if (confirm(`Hủy đơn ${o.code}?`)) cancel.mutate(); }}
        >
          Hủy đơn
        </Button>
      )}
      {cancel.error && <p className="text-sm text-destructive">{errorMessage(cancel.error)}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
