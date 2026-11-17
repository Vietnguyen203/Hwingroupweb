"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { errorMessage } from "@/lib/api";
import { formatDateTime, ORDER_STATUS, PAYMENT_METHOD } from "@/lib/account";
import { formatVnd } from "@/lib/format";
import { AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

export type AdminOrderSummaryResponse = {
  id: string; code: string; customerId: string; recipientName: string; recipientPhone: string; status: string;
  paymentMethod: string; paymentStatus: string; total: number; referralCode: string | null; placedAt: string;
};

const STATUS_OPTIONS: [string, string][] = [["", "Mọi trạng thái"], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label] as [string, string])];

/** Danh sách đơn: lọc trạng thái, phương thức, tìm theo mã / SĐT / tên người nhận. */
export function AdminOrders() {
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminOrderSummaryResponse>("/api/admin/orders");
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
          <Table head={["Mã đơn", "Người nhận", "Tổng", "Thanh toán", "Trạng thái", "CTV", "Đặt lúc"]}>
            {query.data.content.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-link">{o.code}</Link></td>
                <td className="px-3 py-2">{o.recipientName}<br /><span className="text-xs text-muted-foreground">{o.recipientPhone}</span></td>
                <td className="px-3 py-2 font-semibold">{formatVnd(o.total)}</td>
                <td className="px-3 py-2 text-xs">{PAYMENT_METHOD[o.paymentMethod] ?? o.paymentMethod}<br />{o.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</td>
                <td className="px-3 py-2"><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                <td className="px-3 py-2 text-xs">{o.referralCode ?? "–"}</td>
                <td className="px-3 py-2 text-xs">{formatDateTime(o.placedAt)}</td>
              </tr>
            ))}
          </Table>
          {!query.data.content.length && <p className="py-6 text-center text-sm text-muted-foreground">Không có đơn phù hợp.</p>}
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </AdminPage>
  );
}
