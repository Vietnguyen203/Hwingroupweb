"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD, type OrderDetailResponse } from "@/lib/account";
import { formatVnd } from "@/lib/format";
import { ActionButton, Loading } from "./admin-ui";

type AdminOrderResponse = {
  id: string; customerId: string; referralCode: string | null; paymentRef: string | null; detail: OrderDetailResponse;
  history: { fromStatus: string | null; toStatus: string; actorId: string | null; note: string | null; at: string }[];
};

/** Chi tiết đơn cho admin + các thao tác theo vòng đời đơn. Backend kiểm tra lại mọi chuyển trạng thái. */
export function AdminOrderDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const order = useQuery({ queryKey: ["admin-order", id], queryFn: () => api<AdminOrderResponse>(`/api/admin/orders/${id}`) });
  const act = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: unknown }) =>
      api<AdminOrderResponse>(`/api/admin/orders/${id}/${action}`, { method: "POST", body }),
    onSuccess: (o) => {
      qc.setQueryData(["admin-order", id], o);
      qc.invalidateQueries({ queryKey: ["admin", "/api/admin/orders"] });
    },
  });

  if (order.isPending) return <Loading />;
  if (order.error) return <p className="text-sm text-destructive">{errorMessage(order.error)}</p>;
  const { detail: d, history } = order.data;
  const run = (action: string, body?: unknown) => act.mutate({ action, body });
  const withPrompt = (action: string, label: string, key: string) => {
    const v = window.prompt(label);
    if (v !== null) run(action, { [key]: v.trim() || null });
  };

  return (
    <div className="space-y-3">
      <Link href="/admin/orders" className="flex items-center gap-1 text-sm text-brand-link"><ArrowLeft className="size-4" /> Đơn hàng</Link>
      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-brand">Đơn {d.code}</h1>
          <StatusBadge map={ORDER_STATUS} value={d.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(d.placedAt)} · {PAYMENT_METHOD[d.paymentMethod] ?? d.paymentMethod} · {d.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
          {order.data.paymentRef && ` · Mã GD ${order.data.paymentRef}`}{order.data.referralCode && ` · CTV ${order.data.referralCode}`}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {d.paymentMethod === "BANK_QR" && d.paymentStatus !== "PAID" && d.status !== "CANCELLED" &&
            <ActionButton onClick={() => withPrompt("mark-paid", "Mã giao dịch chuyển khoản (không bắt buộc)", "paymentRef")}>Xác nhận đã nhận tiền</ActionButton>}
          {d.status === "PENDING" && <ActionButton onClick={() => run("confirm")}>Xác nhận đơn</ActionButton>}
          {d.status === "CONFIRMED" && <ActionButton onClick={() => run("ship")}>Giao cho vận chuyển</ActionButton>}
          {d.status === "SHIPPING" && <ActionButton onClick={() => run("deliver")}>Đã giao thành công</ActionButton>}
          {d.status === "DELIVERED" && <ActionButton onClick={() => run("return")}>Khách trả hàng</ActionButton>}
          {(d.status === "PENDING" || d.status === "CONFIRMED") &&
            <ActionButton tone="danger" onClick={() => { if (confirm(`Hủy đơn ${d.code}?`)) run("cancel", { reason: "ADMIN" }); }}>Hủy đơn</ActionButton>}
        </div>
        {act.error && <p className="text-sm text-destructive">{errorMessage(act.error)}</p>}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-1 font-bold">Giao tới</h2>
          <p className="font-medium">{d.shippingAddress.recipientName} · {d.shippingAddress.recipientPhone}</p>
          <p className="text-muted-foreground">{d.shippingAddress.fullText}</p>
          {d.note && <p className="mt-1 text-muted-foreground">Ghi chú: {d.note}</p>}
        </section>
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-1 font-bold">Lịch sử trạng thái</h2>
          <ul className="space-y-1">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>{h.fromStatus ? `${ORDER_STATUS[h.fromStatus as keyof typeof ORDER_STATUS]?.label ?? h.fromStatus} → ` : ""}{ORDER_STATUS[h.toStatus as keyof typeof ORDER_STATUS]?.label ?? h.toStatus}{h.note && ` (${h.note})`}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <ul className="divide-y">
          {d.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2 py-2">
              <span>{i.quantity} × {i.productName} <span className="text-muted-foreground">({formatVnd(i.unitPrice)})</span></span>
              <span className="font-semibold">{formatVnd(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(d.subtotal)}</span></div>
          <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(d.shippingFee)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Tổng</span><span className="text-brand-red">{formatVnd(d.total)}</span></div>
        </div>
      </section>
    </div>
  );
}
