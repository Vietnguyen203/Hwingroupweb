"use client";

import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { useAdminList } from "@/hooks/use-admin-list";
import { errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/account";
import { formatVnd } from "@/lib/format";
import { AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type CustomerSummary = {
  id: string; phone: string | null; email: string | null; fullName: string | null; totalOrders: number; totalSpent: number;
  firstOrderAt: string | null; lastOrderAt: string | null; createdAt: string; segment: "NEW" | "LOYAL" | "DORMANT";
};
const SEGMENT: Record<string, string> = { NEW: "Mới", LOYAL: "Thân thiết", DORMANT: "Lâu chưa quay lại" };

/** Danh sách khách: tìm theo SĐT / tên / email, lọc nhóm, xuất CSV theo bộ lọc. */
export function AdminCustomers() {
  const { query, filters, setFilter, page, setPage } = useAdminList<CustomerSummary>("/api/admin/customers");
  const csv = "/api/admin/customers/export.csv?" + new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
  return (
    <AdminPage title="Khách hàng" actions={<a href={csv} className="rounded-lg border bg-white px-3 py-1.5 text-sm">Xuất CSV</a>}>
      <FilterBar>
        <Input placeholder="SĐT / tên / email" defaultValue={filters.q ?? ""} className="h-9 w-56"
               onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim()); }} />
        <Select value={filters.segment ?? ""} onChange={(v) => setFilter("segment", v)}
                options={[["", "Mọi nhóm"], ...Object.entries(SEGMENT)] as [string, string][]} />
      </FilterBar>
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Khách", "Liên hệ", "Nhóm", "Số đơn", "Đã chi", "Đơn gần nhất"]}>
            {query.data.content.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium">{c.fullName || "–"}</td>
                <td className="px-3 py-2 text-xs">{c.phone}{c.phone && c.email && <br />}{c.email}</td>
                <td className="px-3 py-2 text-xs">{SEGMENT[c.segment] ?? c.segment}</td>
                <td className="px-3 py-2">{c.totalOrders}</td>
                <td className="px-3 py-2 font-semibold">{formatVnd(c.totalSpent)}</td>
                <td className="px-3 py-2 text-xs">{c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "–"}</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </AdminPage>
  );
}
