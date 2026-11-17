"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/account";
import { COMMISSION_STATUS } from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type AdminCommissionResponse = {
  id: string; affiliateId: string; customerId: string; orderCode: string; baseAmount: number; amount: number; status: string;
  createdAt: string; eligibleAt: string | null; approvedAt: string | null;
};

/** Hoa hồng của mọi CTV + chạy job duyệt hoa hồng đã đủ 7 ngày (job vẫn tự chạy hằng ngày). */
export function AdminCommissions() {
  const qc = useQueryClient();
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminCommissionResponse>("/api/admin/commissions");
  const job = useMutation({
    mutationFn: () => api<{ asOf: string; approved: number }>("/api/admin/commissions/run-approval-job", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/commissions"] }),
  });
  return (
    <AdminPage title="Hoa hồng" actions={<ActionButton disabled={job.isPending} onClick={() => job.mutate()}>Chạy duyệt hoa hồng</ActionButton>}>
      {job.data && <p className="text-sm text-green-700">Đã duyệt {job.data.approved} hoa hồng.</p>}
      {job.error && <p className="text-sm text-destructive">{errorMessage(job.error)}</p>}
      <FilterBar>
        <Select value={filters.status ?? ""} onChange={(v) => setFilter("status", v)}
                options={[["", "Mọi trạng thái"], ...Object.entries(COMMISSION_STATUS).map(([k, v]) => [k, v.label])] as [string, string][]} />
      </FilterBar>
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Đơn", "Giá trị tính", "Hoa hồng", "Trạng thái", "Tạo lúc", "Duyệt từ"]}>
            {query.data.content.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-semibold">{c.orderCode}</td>
                <td className="px-3 py-2">{formatVnd(c.baseAmount)}</td>
                <td className="px-3 py-2 font-semibold text-brand-red">{formatVnd(c.amount)}</td>
                <td className="px-3 py-2"><StatusBadge map={COMMISSION_STATUS} value={c.status} /></td>
                <td className="px-3 py-2 text-xs">{formatDateTime(c.createdAt)}</td>
                <td className="px-3 py-2 text-xs">{c.eligibleAt ? formatDateTime(c.eligibleAt) : "chờ giao hàng"}</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </AdminPage>
  );
}
