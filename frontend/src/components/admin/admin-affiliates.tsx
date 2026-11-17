"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/account";
import { AFFILIATE_STATUS } from "@/lib/affiliate";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type AdminAffiliateResponse = {
  id: string; fullName: string; phone: string; status: string; referralCode: string | null; socialLink: string | null;
  note: string | null; statusReason: string | null; bankName: string | null; bankAccountNoMasked: string | null; createdAt: string;
  hasIdCard: boolean;
};

/** Duyệt / từ chối / tạm khóa / mở khóa CTV. */
export function AdminAffiliates() {
  const qc = useQueryClient();
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminAffiliateResponse>("/api/admin/affiliates", { status: "PENDING" });
  const [idCardOf, setIdCardOf] = useState<AdminAffiliateResponse | null>(null);
  const act = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      api(`/api/admin/affiliates/${id}/${action}`, { method: "POST", body: reason === undefined ? undefined : { reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/affiliates"] }),
  });
  const withReason = (id: string, action: string, label: string) => {
    const reason = window.prompt(label);
    if (reason) act.mutate({ id, action, reason });
  };

  return (
    <AdminPage title="Cộng tác viên">
      <FilterBar>
        <Input placeholder="Tên / SĐT / mã giới thiệu" defaultValue={filters.q ?? ""} className="h-9 w-56"
               onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim()); }} />
        <Select value={filters.status ?? ""} onChange={(v) => setFilter("status", v)}
                options={[["", "Mọi trạng thái"], ...Object.entries(AFFILIATE_STATUS).map(([k, v]) => [k, v.label])] as [string, string][]} />
      </FilterBar>
      {act.error && <p className="text-sm text-destructive">{errorMessage(act.error)}</p>}
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["CTV", "Mã", "Giới thiệu", "CCCD", "Ngân hàng", "Trạng thái", "Thao tác"]}>
            {query.data.content.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-3 py-2"><b>{a.fullName}</b><br /><span className="text-xs text-muted-foreground">{a.phone} · {formatDateTime(a.createdAt)}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{a.referralCode ?? "–"}</td>
                <td className="max-w-56 px-3 py-2 text-xs">
                  {a.socialLink && <a href={a.socialLink} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-link">{a.socialLink}</a>}
                  {a.note && <p className="text-muted-foreground">{a.note}</p>}
                </td>
                <td className="px-3 py-2 text-xs">
                  {a.hasIdCard
                    ? <ActionButton onClick={() => setIdCardOf(a)}>{a.status === "PENDING" ? "Xem hồ sơ" : "Xem ảnh"}</ActionButton>
                    : <span className="text-muted-foreground">Chưa có</span>}
                </td>
                <td className="px-3 py-2 text-xs">{a.bankName ? `${a.bankName} · ${a.bankAccountNoMasked}` : "–"}</td>
                <td className="px-3 py-2"><StatusBadge map={AFFILIATE_STATUS} value={a.status} />{a.statusReason && <p className="text-xs text-muted-foreground">{a.statusReason}</p>}</td>
                <td className="space-x-1 px-3 py-2 whitespace-nowrap">
                  {a.status === "PENDING" && <>
                    <ActionButton onClick={() => act.mutate({ id: a.id, action: "approve" })}>Duyệt</ActionButton>
                    <ActionButton tone="danger" onClick={() => withReason(a.id, "reject", "Lý do từ chối")}>Từ chối</ActionButton>
                  </>}
                  {a.status === "APPROVED" && <ActionButton tone="danger" onClick={() => withReason(a.id, "suspend", "Lý do tạm khóa")}>Tạm khóa</ActionButton>}
                  {a.status === "SUSPENDED" && <ActionButton onClick={() => act.mutate({ id: a.id, action: "reinstate" })}>Mở khóa</ActionButton>}
                </td>
              </tr>
            ))}
          </Table>
          {!query.data.content.length && <p className="py-6 text-center text-sm text-muted-foreground">Không có CTV phù hợp.</p>}
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
      {idCardOf && (
        <AffiliateReviewDialog
          affiliate={idCardOf}
          busy={act.isPending}
          error={act.error ? errorMessage(act.error) : null}
          onClose={() => { act.reset(); setIdCardOf(null); }}
          onApprove={() => act.mutate({ id: idCardOf.id, action: "approve" }, { onSuccess: () => setIdCardOf(null) })}
          onReject={(reason) => act.mutate({ id: idCardOf.id, action: "reject", reason }, { onSuccess: () => setIdCardOf(null) })}
        />
      )}
    </AdminPage>
  );
}

/**
 * Hộp hồ sơ CTV: thông tin + ảnh CCCD mặt trước/sau (bấm để mở bản đầy đủ) + Duyệt / Từ chối khi đang chờ duyệt.
 * Ảnh chỉ tải được khi đang đăng nhập ADMIN (API không cache, mỗi lần xem có ghi audit).
 */
function AffiliateReviewDialog({ affiliate, busy, error, onClose, onApprove, onReject }: {
  affiliate: AdminAffiliateResponse;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const info: [string, string | null][] = [
    ["Họ tên", affiliate.fullName],
    ["Số điện thoại", affiliate.phone],
    ["Link mạng xã hội", affiliate.socialLink],
    ["Ghi chú", affiliate.note],
    ["Ngày đăng ký", formatDateTime(affiliate.createdAt)],
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Hồ sơ cộng tác viên" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Hồ sơ CTV: {affiliate.fullName}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1 text-sm">Đóng</button>
        </div>

        <dl className="mb-4 grid grid-cols-[130px_1fr] gap-y-1.5 text-sm">
          {info.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>
          ))}
          <dt className="text-muted-foreground">Trạng thái</dt>
          <dd><StatusBadge map={AFFILIATE_STATUS} value={affiliate.status} /></dd>
        </dl>

        <p className="mb-2 text-sm font-semibold">Ảnh CCCD <span className="font-normal text-muted-foreground">(bấm vào ảnh để mở bản đầy đủ)</span></p>
        <div className="grid gap-4 md:grid-cols-2">
          {(["front", "back"] as const).map((side) => {
            const src = `/api/admin/affiliates/${affiliate.id}/id-card/${side}`;
            const label = side === "front" ? "Mặt trước" : "Mặt sau";
            return (
              <figure key={side} className="space-y-1">
                <a href={src} target="_blank" rel="noopener noreferrer" title={`Mở ${label.toLowerCase()} ở tab mới`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh có phân quyền, không qua tối ưu ảnh của Next */}
                  <img src={src} alt={`CCCD ${label.toLowerCase()}`} className="max-h-72 w-full rounded-lg border bg-neutral-50 object-contain" />
                </a>
                <figcaption className="text-center text-xs text-muted-foreground">{label}</figcaption>
              </figure>
            );
          })}
        </div>

        {affiliate.status === "PENDING" && (
          <div className="mt-5 space-y-3 border-t pt-4">
            {rejecting ? (
              <div className="space-y-2">
                <textarea autoFocus rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="Lý do từ chối (bắt buộc, CTV sẽ thấy lý do này)"
                          className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring" />
                <div className="flex gap-2">
                  <ActionButton tone="danger" disabled={busy || !reason.trim()} onClick={() => onReject(reason.trim())}>Xác nhận từ chối</ActionButton>
                  <ActionButton onClick={() => { setRejecting(false); setReason(""); }}>Hủy</ActionButton>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <ActionButton disabled={busy} onClick={onApprove}>Duyệt CTV</ActionButton>
                <ActionButton tone="danger" disabled={busy} onClick={() => setRejecting(true)}>Từ chối</ActionButton>
              </div>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
