"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { useAffiliateNames } from "@/hooks/use-affiliate-names";
import { errorMessage } from "@/lib/api";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD } from "@/lib/account";
import { formatVnd } from "@/lib/format";
import { AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";
import { OrderConfirmDialog } from "./order-confirm-dialog";

export type AdminOrderSummaryResponse = {
  id: string; code: string; customerId: string; recipientName: string; recipientPhone: string; status: string;
  paymentMethod: string; paymentStatus: string; total: number; referralCode: string | null; placedAt: string;
};

const STATUS_OPTIONS: [string, string][] = [["", "Mọi trạng thái"], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label] as [string, string])];

/** Danh sách đơn: lọc trạng thái, phương thức, tìm theo mã / SĐT / tên người nhận. */
export function AdminOrders() {
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminOrderSummaryResponse>("/api/admin/orders");
  const [confirming, setConfirming] = useState<string | null>(null); // id đơn đang mở màn xác nhận
  const ctvNames = useAffiliateNames(query.data?.content.map((o) => o.referralCode) ?? []); // tên CTV theo mã, hiện thay cho mã
  return (
    <AdminPage title="Đơn hàng">
      <FilterBar>
        <Input placeholder="Mã đơn / SĐT / tên" defaultValue={filters.q ?? ""} className="h-9 w-56"
               onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim()); }} />
        <Select value={filters.status ?? ""} onChange={(v) => setFilter("status", v)} options={STATUS_OPTIONS} />
        <Select value={filters.paymentMethod ?? ""} onChange={(v) => setFilter("paymentMethod", v)}
                options={[["", "Mọi thanh toán"], ["COD", "COD"], ["BANK_QR", "Chuyển khoản QR"]]} />
        <Select value={filters.paymentStatus ?? ""} onChange={(v) => setFilter("paymentStatus", v)}
                options={[["", "Đã / chưa thanh toán"], ["PAID", "Đã thanh toán"], ["UNPAID", "Chưa thanh toán"]]} />
      </FilterBar>
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Mã đơn", "Người nhận", "Tổng", "Thanh toán", "Trạng thái", "CTV", "Đặt lúc", "Thao tác"]}>
            {query.data.content.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-link">{o.code}</Link></td>
                <td className="px-3 py-2">{o.recipientName}<br /><span className="text-xs text-muted-foreground">{o.recipientPhone}</span></td>
                <td className="px-3 py-2 font-semibold">{formatVnd(o.total)}</td>
                <td className="px-3 py-2 text-xs">{PAYMENT_METHOD[o.paymentMethod] ?? o.paymentMethod}<br />{o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</td>
                <td className="px-3 py-2"><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                <td className="px-3 py-2 text-xs">
                  {o.referralCode ? (
                    <>
                      {ctvNames[o.referralCode] && <span className="font-semibold text-slate-800">{ctvNames[o.referralCode]}<br /></span>}
                      <span className="font-mono text-[11px] text-slate-500">{o.referralCode}</span>
                    </>
                  ) : "–"}
                </td>
                <td className="px-3 py-2 text-xs">{formatDateTime(o.placedAt)}</td>
                <td className="px-3 py-2">
                  {o.status === "PENDING" ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(o.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
                    >
                      <ClipboardCheck className="size-3.5" aria-hidden /> Xác nhận
                    </button>
                  ) : (
                    <Link href={`/admin/orders/${o.id}`} className="text-xs font-semibold text-brand-link hover:underline">Xem</Link>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          {!query.data.content.length && <p className="py-6 text-center text-sm text-muted-foreground">Không có đơn phù hợp.</p>}
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
      {confirming && <OrderConfirmDialog orderId={confirming} onClose={() => setConfirming(null)} />}
    </AdminPage>
  );
}
