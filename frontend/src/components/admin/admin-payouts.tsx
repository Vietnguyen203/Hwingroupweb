"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/account";
import { PAYOUT_STATUS } from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type AdminPayoutResponse = {
  id: string; affiliateId: string; amount: number; status: string; bankName: string; accountNo: string; accountHolder: string;
  requestedAt: string; paidAt: string | null; transactionRef: string | null; rejectReason: string | null;
};

/**
 * Yêu cầu rút tiền: duyệt -> chuyển khoản -> nhập mã giao dịch. Số tài khoản đầy đủ chỉ lấy khi bấm "Xem STK"
 * (backend ghi nhật ký mỗi lần xem).
 */
export function AdminPayouts() {
  const qc = useQueryClient();
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminPayoutResponse>("/api/admin/payouts", { status: "REQUESTED" });
  const [revealed, setRevealed] = useState<Record<string, AdminPayoutResponse>>({});
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/payouts"] });
  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: unknown }) =>
      api(`/api/admin/payouts/${id}/${action}`, { method: "POST", body }),
    onSuccess: refresh,
  });
  const reveal = useMutation({
    mutationFn: (id: string) => api<AdminPayoutResponse>(`/api/admin/payouts/${id}`),
    onSuccess: (p) => setRevealed((r) => ({ ...r, [p.id]: p })),
  });

  return (
    <AdminPage title="Rút tiền">
      <FilterBar>
        <Select value={filters.status ?? ""} onChange={(v) => setFilter("status", v)}
                options={[["", "Mọi trạng thái"], ...Object.entries(PAYOUT_STATUS).map(([k, v]) => [k, v.label])] as [string, string][]} />
      </FilterBar>
      {(act.error || reveal.error) && <p className="text-sm text-destructive">{errorMessage(act.error ?? reveal.error)}</p>}
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Số tiền", "Tài khoản nhận", "Trạng thái", "Yêu cầu lúc", "Thao tác"]}>
            {query.data.content.map((p) => {
              const full = revealed[p.id];
              return (
                <tr key={p.id} className="align-top">
                  <td className="px-3 py-2 font-semibold text-brand-red">{formatVnd(p.amount)}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.bankName} · {full ? <b>{full.accountNo}</b> : p.accountNo}<br />{p.accountHolder}
                    {!full && <button className="ml-1 text-brand-link" onClick={() => reveal.mutate(p.id)}>Xem STK</button>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge map={PAYOUT_STATUS} value={p.status} />
                    {p.transactionRef && <p className="text-xs">GD {p.transactionRef}</p>}
                    {p.rejectReason && <p className="text-xs text-muted-foreground">{p.rejectReason}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs">{formatDateTime(p.requestedAt)}</td>
                  <td className="space-x-1 px-3 py-2 whitespace-nowrap">
                    {p.status === "REQUESTED" && <ActionButton onClick={() => act.mutate({ id: p.id, action: "approve" })}>Duyệt</ActionButton>}
                    {p.status === "APPROVED" && <ActionButton onClick={() => {
                      const ref = window.prompt("Mã giao dịch chuyển khoản");
                      if (ref) act.mutate({ id: p.id, action: "pay", body: { transactionRef: ref.trim() } });
                    }}>Đã chuyển tiền</ActionButton>}
                    {(p.status === "REQUESTED" || p.status === "APPROVED") && <ActionButton tone="danger" onClick={() => {
                      const reason = window.prompt("Lý do từ chối");
                      if (reason) act.mutate({ id: p.id, action: "reject", body: { reason } });
                    }}>Từ chối</ActionButton>}
                  </td>
                </tr>
              );
            })}
          </Table>
          {!query.data.content.length && <p className="py-6 text-center text-sm text-muted-foreground">Không có yêu cầu phù hợp.</p>}
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </AdminPage>
  );
}
