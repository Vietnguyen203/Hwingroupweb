"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ChevronRight, CircleAlert, Copy, MapPin, Package, PackageCheck, ShoppingBag } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { OrderDetailSkeleton } from "@/components/skeletons/page-skeletons";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, ApiError, errorMessage } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD, type OrderDetailResponse, type OrderStatus } from "@/lib/account";
import { confettiShower } from "@/lib/fx";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Số giờ khách có để chuyển khoản trước khi đơn tự hủy (khớp cấu hình backend bank-qr-payment-timeout-hours). */
const QR_TIMEOUT_HOURS = 24;

/** Chi tiết một đơn của khách. Sau khi đặt (?placed=1) hiện trang "Đặt hàng thành công"; đơn PENDING có nút hủy. */
export function OrderDetailView({ code }: { code: string }) {
  const placed = useQueryParam("placed") === "1";
  const qc = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const order = useQuery({
    queryKey: ["order", code],
    queryFn: () => api<OrderDetailResponse>(`/api/me/orders/${encodeURIComponent(code)}`),
  });
  const cancel = useMutation({
    mutationFn: () => api<OrderDetailResponse>(`/api/me/orders/${encodeURIComponent(code)}/cancel`, { method: "POST" }),
    onSuccess: (o) => {
      qc.setQueryData(["order", code], o);
      qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmCancel(false);
    },
  });
  // Khách xác nhận đã nhận hàng: đơn đang giao -> đã giao (mở hạn đổi trả và quyền đánh giá sản phẩm)
  const receive = useMutation({
    mutationFn: () => api<OrderDetailResponse>(`/api/me/orders/${encodeURIComponent(code)}/confirm-received`, { method: "POST" }),
    onSuccess: (o) => {
      qc.setQueryData(["order", code], o);
      qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmReceive(false);
      confettiShower();
    },
  });

  const back = <Breadcrumb items={[{ label: "Tài khoản", href: "/account" }, { label: `Đơn ${code}` }]} />;

  if (order.isPending) return <OrderDetailSkeleton />;
  if (order.error) {
    const msg = order.error instanceof ApiError && order.error.status === 401
      ? <>Vui lòng <Link href={`/login?next=/account/orders/${code}`} className="text-brand-link">đăng nhập</Link>.</>
      : errorMessage(order.error);
    return <div className="space-y-3 px-3 py-4 md:px-0 md:py-8">{back}<p className="rounded-xl bg-white p-4 text-sm">{msg}</p></div>;
  }

  const o = order.data;
  const st = ORDER_STATUS[o.status];
  const isQr = o.paymentMethod === "BANK_QR";

  return (
    <div className="space-y-4 px-3 py-4 md:px-0 md:py-8">
      {back}

      {placed ? <SuccessHero order={o} /> : (
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 ring-1 ring-black/[0.06] md:p-5">
          <div>
            <h1 className="text-xl font-bold text-brand">Đơn {o.code}</h1>
            <p className="text-sm text-muted-foreground">Đặt lúc {formatDateTime(o.placedAt)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.className}`}>{st.label}</span>
        </section>
      )}

      <OrderProgress status={o.status} cancelReason={o.cancelReason} />

      {o.receivable && (
        <section className="flex flex-col gap-3 rounded-xl border border-transparent bg-brand-honey/15 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-honey/40 text-brand-deep"><PackageCheck className="size-5" /></span>
            <div>
              <p className="font-bold text-neutral-900">Đơn hàng đang trên đường giao tới bạn</p>
              <p className="text-sm text-neutral-600">Khi đã nhận đủ hàng, vui lòng bấm xác nhận để hoàn tất đơn.</p>
            </div>
          </div>
          <button type="button" onClick={() => setConfirmReceive(true)}
                  className="h-11 shrink-0 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:brightness-110">
            Đã nhận được hàng
          </button>
        </section>
      )}
      {receive.error && <p className="text-sm text-destructive">{errorMessage(receive.error)}</p>}

      {o.payment && <BankTransferCard order={o} />}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="rounded-xl bg-white p-4 ring-1 ring-black/[0.06] md:p-5">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-neutral-900"><Package className="size-4 text-brand" /> Sản phẩm ({o.items.reduce((n, i) => n + i.quantity, 0)})</h2>
            <ul className="divide-y text-sm">
              {o.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.imageUrl ? <img src={i.imageUrl} alt="" className="size-16 rounded-lg border object-cover" /> : <div className="size-16 rounded-lg bg-neutral-100" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${i.productSlug}`} className="line-clamp-2 font-medium hover:text-brand">{i.productName}</Link>
                    <p className="text-muted-foreground">{formatVnd(i.unitPrice)} × {i.quantity}</p>
                  </div>
                  <span className="font-semibold">{formatVnd(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-white p-4 text-sm ring-1 ring-black/[0.06] md:p-5">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-neutral-900"><MapPin className="size-4 text-brand" /> Giao tới</h2>
            <p className="font-medium">{o.shippingAddress.recipientName} · {o.shippingAddress.recipientPhone}</p>
            <p className="text-muted-foreground">{o.shippingAddress.fullText}</p>
            {o.note && <p className="mt-1 text-muted-foreground">Ghi chú: {o.note}</p>}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <section className="space-y-2 rounded-xl bg-white p-4 text-sm ring-1 ring-black/[0.06] md:p-5">
            <h2 className="font-bold text-neutral-900">Thanh toán</h2>
            <p className="text-neutral-700">{PAYMENT_METHOD[o.paymentMethod] ?? o.paymentMethod}</p>
            <p className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold", o.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
              {o.paymentStatus === "PAID" ? "Đã thanh toán" : isQr ? "Chờ chuyển khoản" : "Thanh toán khi nhận hàng"}
            </p>
            <div className="space-y-1.5 border-t pt-3">
              <Row label="Tạm tính" value={formatVnd(o.subtotal)} />
              {o.discount > 0 && <Row label="Giảm giá" value={`-${formatVnd(o.discount)}`} />}
              <Row label="Phí giao hàng" value={o.shippingFee === 0 ? "Miễn phí" : formatVnd(o.shippingFee)} />
              <div className="flex items-baseline justify-between border-t border-dashed pt-2 text-base font-bold"><span>Tổng cộng</span><span className="text-xl font-black text-brand-red">{formatVnd(o.total)}</span></div>
            </div>
          </section>

          {o.cancellable && (
            <button type="button" onClick={() => setConfirmCancel(true)}
                    className="h-11 w-full rounded-xl border border-destructive/40 bg-white text-sm font-semibold text-destructive transition hover:bg-red-50">
              Hủy đơn hàng
            </button>
          )}
          {cancel.error && <p className="text-sm text-destructive">{errorMessage(cancel.error)}</p>}
        </aside>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        title={`Hủy đơn ${o.code}?`}
        message="Đơn hàng sẽ bị hủy và không thể khôi phục. Hàng trong đơn được trả lại kho."
        confirmText="Hủy đơn"
        cancelText="Giữ đơn"
        tone="danger"
        loading={cancel.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => cancel.mutate()}
      />
      <ConfirmModal
        isOpen={confirmReceive}
        title={`Xác nhận đã nhận đơn ${o.code}?`}
        message="Hãy kiểm tra hàng trước khi xác nhận. Sau khi xác nhận, đơn chuyển sang “Đã giao” và bạn có thể đánh giá sản phẩm."
        confirmText="Đã nhận hàng"
        cancelText="Chưa nhận"
        tone="info"
        loading={receive.isPending}
        onCancel={() => setConfirmReceive(false)}
        onConfirm={() => receive.mutate()}
      />
    </div>
  );
}

/** Khối chúc mừng sau khi đặt hàng: mã đơn (chép được), lời nhắn theo cách thanh toán, lối đi tiếp. */
function SuccessHero({ order: o }: { order: OrderDetailResponse }) {
  const isQr = o.paymentMethod === "BANK_QR" && !!o.payment;
  useEffect(() => {
    confettiShower(); // mưa pháo giấy ăn mừng đặt hàng thành công
  }, []);
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center ring-1 ring-black/[0.06] md:p-8">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-brand-green"><CheckCircle2 className="size-10" /></span>
      <h1 className="mt-3 text-xl font-bold text-emerald-900 md:text-2xl">Đặt hàng thành công!</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {isQr ? "Vui lòng chuyển khoản bên dưới để giữ đơn. Chúng tôi sẽ xác nhận ngay khi nhận được tiền."
              : "Chúng tôi sẽ liên hệ xác nhận đơn sớm. Bạn thanh toán khi nhận hàng."}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm">
        <span className="text-muted-foreground">Mã đơn</span>
        <b className="font-mono text-base tracking-wide text-neutral-900">{o.code}</b>
        <CopyButton value={o.code} label="Chép mã đơn" />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:brightness-110"><ShoppingBag className="size-4" /> Tiếp tục mua sắm</Link>
        <Link href="/account" className="inline-flex h-11 items-center gap-1 rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50">Xem đơn hàng của tôi <ChevronRight className="size-4" /></Link>
      </div>
    </section>
  );
}

const STEPS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "placed", label: "Đã đặt hàng", statuses: ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED", "RETURNED"] },
  { key: "confirmed", label: "Đã xác nhận", statuses: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED", "RETURNED"] },
  { key: "shipping", label: "Đang giao", statuses: ["SHIPPING", "DELIVERED", "COMPLETED", "RETURNED"] },
  { key: "delivered", label: "Đã giao", statuses: ["DELIVERED", "COMPLETED", "RETURNED"] },
];

/** Tiến trình đơn: 4 mốc; đơn đã hủy / trả hàng hiện thông báo riêng thay vì thanh tiến trình. */
function OrderProgress({ status, cancelReason }: { status: OrderStatus; cancelReason: string | null }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <section className="flex items-start gap-3 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-700">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-neutral-500" />
        <div>
          <p className="font-semibold">{status === "CANCELLED" ? "Đơn hàng đã bị hủy" : "Đơn hàng đã được trả lại"}</p>
          {cancelReason && <p className="text-neutral-500">Lý do: {cancelReason}</p>}
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Tiến trình đơn hàng" className="rounded-xl bg-white p-4 ring-1 ring-black/[0.06] md:p-5">
      <ol className="grid grid-cols-4">
        {STEPS.map((s, i) => {
          const done = s.statuses.includes(status);
          const nextDone = STEPS[i + 1]?.statuses.includes(status);
          return (
            <li key={s.key} className="relative flex flex-col items-center gap-1.5 text-center">
              {i > 0 && <span className={cn("absolute top-3.5 right-1/2 h-0.5 w-full", done ? "bg-brand-green" : "bg-neutral-200")} aria-hidden />}
              <span className={cn("relative z-10 flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                done ? "border-brand-green bg-brand-green text-white" : "border-neutral-300 bg-white text-neutral-400")}>
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-xs md:text-sm", done ? "font-semibold text-neutral-900" : "text-neutral-400", done && !nextDone && "text-brand-green")}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Hướng dẫn chuyển khoản: mã QR, thông tin chép nhanh, các bước và hạn chuyển khoản. */
function BankTransferCard({ order: o }: { order: OrderDetailResponse }) {
  const p = o.payment!;
  const deadline = new Date(new Date(o.placedAt).getTime() + QR_TIMEOUT_HOURS * 3600_000);
  return (
    <section className="rounded-xl border border-transparent bg-white p-4 ring-1 ring-black/[0.06] md:p-6">
      <h2 className="mb-4 text-lg font-bold text-brand">Chuyển khoản để hoàn tất đơn</h2>
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="mx-auto shrink-0 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- mã QR do backend sinh */}
          <img src={p.qrImageUrl} alt="Mã QR chuyển khoản" className="size-52 rounded-xl border bg-white p-1 md:size-56" />
          <p className="mt-1.5 text-xs text-muted-foreground">Quét bằng app ngân hàng</p>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <dl className="space-y-2 text-sm">
            <InfoRow label="Số tiền" value={formatVnd(p.amount)} copy={String(p.amount)} strong accent />
            <InfoRow label="Số tài khoản" value={p.accountNo} copy={p.accountNo} strong />
            <InfoRow label="Chủ tài khoản" value={p.accountName} />
            <InfoRow label="Nội dung" value={p.transferContent} copy={p.transferContent} strong />
          </dl>

          <ol className="list-decimal space-y-1 rounded-xl bg-neutral-50 p-3 pl-7 text-xs text-neutral-600">
            <li>Mở app ngân hàng, chọn quét mã QR (hoặc nhập thông tin ở trên).</li>
            <li>Kiểm tra đúng số tiền và <b>nội dung chuyển khoản</b>.</li>
            <li>Xác nhận chuyển; đơn được xác nhận ngay khi nhận được tiền.</li>
          </ol>

          <p className="flex items-start gap-1.5 rounded-lg bg-brand-honey/20 px-3 py-2 text-xs text-neutral-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Vui lòng chuyển khoản trước <b>{formatDateTime(deadline.toISOString())}</b> ({QR_TIMEOUT_HOURS} giờ). Quá hạn mà chưa nhận được tiền, đơn sẽ tự hủy.
          </p>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, copy, strong, accent }: { label: string; value: string; copy?: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 flex-1 break-all", strong && "font-semibold", accent && "text-base font-bold text-brand-red")}>{value}</dd>
      {copy && <CopyButton value={copy} label={`Chép ${label.toLowerCase()}`} />}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        // Chép không được (trình duyệt chặn) thì không báo "đã chép"; khách vẫn tự bôi đen chép được
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-brand"
    >
      {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
