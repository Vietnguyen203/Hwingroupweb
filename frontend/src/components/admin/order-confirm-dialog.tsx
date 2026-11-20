"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, CreditCard, MapPin, Phone, ShoppingBag, StickyNote, Tag, UserRound, X, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { showToast } from "@/components/ui/toast";
import { useAffiliateNames } from "@/hooks/use-affiliate-names";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD, type OrderDetailResponse } from "@/lib/account";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AdminOrderResponse = {
  id: string; customerId: string; referralCode: string | null; paymentRef: string | null; detail: OrderDetailResponse;
  history: { fromStatus: string | null; toStatus: string; actorId: string | null; note: string | null; at: string }[];
};

/**
 * Màn "Xác nhận đơn hàng": admin xem đủ thông tin đơn (người nhận, địa chỉ, thanh toán, nguồn CTV, sản phẩm, tổng tiền)
 * rồi xác nhận (POST /api/admin/orders/{id}/confirm, PENDING -> CONFIRMED) hoặc hủy đơn.
 * Backend vẫn kiểm tra lại mọi chuyển trạng thái; ở đây chỉ hiển thị và gọi API sẵn có.
 */
export function OrderConfirmDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const titleId = useId();
  const [askCancel, setAskCancel] = useState(false);
  const order = useQuery({ queryKey: ["admin-order", orderId], queryFn: () => api<AdminOrderResponse>(`/api/admin/orders/${orderId}`) });

  const ctvNames = useAffiliateNames([order.data?.referralCode]);

  const act = useMutation({
    mutationFn: (action: "confirm" | "cancel") =>
      api<AdminOrderResponse>(`/api/admin/orders/${orderId}/${action}`, { method: "POST", body: action === "cancel" ? { reason: "ADMIN" } : undefined }),
    onSuccess: (o, action) => {
      qc.setQueryData(["admin-order", orderId], o);
      qc.invalidateQueries({ queryKey: ["admin", "/api/admin/orders"] });
      showToast({ type: "success", title: action === "confirm" ? "Đã xác nhận đơn" : "Đã hủy đơn", message: `Đơn ${o.detail.code}` });
      onClose();
    },
  });

  // Esc để đóng (trừ lúc đang gửi), khóa cuộn nền
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !act.isPending && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [act.isPending, onClose]);

  const d = order.data?.detail;
  const pending = d?.status === "PENDING";
  const bankUnpaid = !!d && d.paymentMethod === "BANK_QR" && d.paymentStatus !== "PAID";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-in fade-in duration-200 sm:p-6"
      onClick={act.isPending ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-pop animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Đầu hộp thoại */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-b from-brand-soft/60 to-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-brand/25">
              <ClipboardCheck className="size-5.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-extrabold tracking-tight break-words text-slate-900">
                Xác nhận đơn {d?.code ?? ""}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                {d && <StatusBadge map={ORDER_STATUS} value={d.status} />}
                <span>{d ? `Đặt lúc ${formatDateTime(d.placedAt)}` : "Đang tải thông tin đơn…"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={act.isPending}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {order.isPending ? (
            <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : order.error || !d ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage(order.error)}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-[1fr_1.15fr]">
              <div className="space-y-4">
                <Field icon={UserRound} label="Người nhận">
                  <span className="font-semibold">{d.shippingAddress.recipientName}</span>
                </Field>
                <Field icon={Phone} label="Số điện thoại">
                  <a href={`tel:${d.shippingAddress.recipientPhone}`} className="font-semibold text-brand-link hover:underline">{d.shippingAddress.recipientPhone}</a>
                </Field>
                <Field icon={MapPin} label="Địa chỉ giao hàng">{d.shippingAddress.fullText}</Field>
                {d.note && <Field icon={StickyNote} label="Ghi chú của khách">{d.note}</Field>}
                <Field icon={CreditCard} label="Thanh toán">
                  <span className="font-semibold">{PAYMENT_METHOD[d.paymentMethod] ?? d.paymentMethod}</span>{" "}
                  <span className={cn("ml-1 rounded-full px-2 py-0.5 text-xs font-semibold", d.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                    {d.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                  {order.data.paymentRef && <span className="mt-0.5 block text-xs text-slate-500">Mã giao dịch: {order.data.paymentRef}</span>}
                </Field>
                <Field icon={Tag} label="Nguồn đơn">
                  {order.data.referralCode
                    ? <>Qua CTV {ctvNames[order.data.referralCode] && <b>{ctvNames[order.data.referralCode]} </b>}<code className="rounded bg-brand-soft px-1.5 py-0.5 font-mono text-xs font-bold text-brand">{order.data.referralCode}</code></>
                    : <span className="text-slate-500">Mua trực tiếp (không qua CTV)</span>}
                </Field>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <ShoppingBag className="size-3.5" aria-hidden /> Sản phẩm ({d.items.reduce((n, i) => n + i.quantity, 0)})
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {d.items.map((i) => (
                    <li key={i.productId} className="flex items-center gap-3 p-3">
                      {i.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={i.imageUrl} alt="" className="size-12 shrink-0 rounded-lg border border-slate-100 object-cover" />
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ShoppingBag className="size-5" aria-hidden /></span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-slate-900">{i.productName}</p>
                        <p className="text-xs text-slate-500">{i.quantity} × {formatVnd(i.unitPrice)}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-900 tabular-nums">{formatVnd(i.lineTotal)}</p>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="Tạm tính" value={formatVnd(d.subtotal)} />
                  {d.discount > 0 && <Row label="Giảm giá" value={`−${formatVnd(d.discount)}`} />}
                  <Row label="Phí giao hàng" value={d.shippingFee === 0 ? "Miễn phí" : formatVnd(d.shippingFee)} />
                  <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
                    <dt className="font-bold text-slate-900">Tổng cộng</dt>
                    <dd className="text-xl font-extrabold text-brand-red tabular-nums">{formatVnd(d.total)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {bankUnpaid && pending && (
            <p role="note" className="mt-5 flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Đơn chuyển khoản chưa ghi nhận thanh toán. Nên đối chiếu sao kê theo mã đơn trước khi xác nhận
                (mở <Link href={`/admin/orders/${orderId}`} className="font-semibold underline underline-offset-2">chi tiết đơn</Link> để bấm &ldquo;Xác nhận đã nhận tiền&rdquo;).
              </span>
            </p>
          )}
          {d && !pending && (
            <p role="note" className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Đơn không còn ở trạng thái chờ xác nhận ({ORDER_STATUS[d.status as keyof typeof ORDER_STATUS]?.label ?? d.status}).
            </p>
          )}
          {act.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage(act.error)}</p>}
        </div>

        {/* Chân hộp thoại: thao tác */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <Link href={`/admin/orders/${orderId}`} className="text-sm font-semibold text-brand-link hover:underline">Xem chi tiết đầy đủ</Link>
          {askCancel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Hủy đơn {d?.code}?</span>
              <button type="button" onClick={() => setAskCancel(false)} disabled={act.isPending} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Giữ đơn
              </button>
              <button type="button" onClick={() => act.mutate("cancel")} disabled={act.isPending} className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                {act.isPending ? "Đang hủy…" : "Xác nhận hủy"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {d && (d.status === "PENDING" || d.status === "CONFIRMED") && (
                <button type="button" onClick={() => setAskCancel(true)} disabled={act.isPending} className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                  Hủy đơn
                </button>
              )}
              <button type="button" onClick={onClose} disabled={act.isPending} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Đóng
              </button>
              {pending && (
                <button
                  type="button"
                  autoFocus
                  onClick={() => act.mutate("confirm")}
                  disabled={act.isPending}
                  className="h-10 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {act.isPending ? "Đang xác nhận…" : "Xác nhận đơn"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 tabular-nums">{value}</dd>
    </div>
  );
}
