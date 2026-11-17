"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { StarRating } from "@/components/product/star-rating";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { showToast } from "@/components/ui/toast";
import { useAdminList } from "@/hooks/use-admin-list";
import { formatDateTime } from "@/lib/account";
import { api, errorMessage } from "@/lib/api";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type AdminProductReview = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  reviewerName: string;
  rating: number;
  comment: string | null;
  visible: boolean;
  createdAt: string;
};

/**
 * Kiểm duyệt đánh giá sản phẩm: xem tất cả (kể cả đã ẩn), lọc theo trạng thái / số sao / từ khóa, ẩn hoặc hiện lại.
 * Đánh giá bị ẩn không còn trên trang sản phẩm và không tính vào điểm trung bình.
 */
export function AdminReviews() {
  const qc = useQueryClient();
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminProductReview>("/api/admin/product-reviews");
  const [hiding, setHiding] = useState<AdminProductReview | null>(null);
  const [reason, setReason] = useState("");

  const setVisible = useMutation({
    mutationFn: ({ id, visible, reason }: { id: string; visible: boolean; reason?: string }) =>
      api<AdminProductReview>(`/api/admin/product-reviews/${id}/visibility`, { method: "PATCH", body: { visible, reason: reason || null } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "/api/admin/product-reviews"] });
      showToast({ type: "success", message: r.visible ? "Đã hiện lại đánh giá." : "Đã ẩn đánh giá khỏi trang sản phẩm." });
      setHiding(null);
      setReason("");
    },
    onError: (err) => showToast({ type: "error", title: "Lỗi", message: errorMessage(err) }),
  });

  return (
    <AdminPage title="Đánh giá sản phẩm">
      <FilterBar>
        <Input placeholder="Tìm nội dung / tên người đánh giá" defaultValue={filters.q ?? ""} className="h-9 w-64"
               onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim()); }} />
        <Select value={filters.visible ?? ""} onChange={(v) => setFilter("visible", v)}
                options={[["", "Mọi trạng thái"], ["true", "Đang hiển thị"], ["false", "Đã ẩn"]]} />
        <Select value={filters.rating ?? ""} onChange={(v) => setFilter("rating", v)}
                options={[["", "Mọi số sao"], ["5", "5 sao"], ["4", "4 sao"], ["3", "3 sao"], ["2", "2 sao"], ["1", "1 sao"]]} />
      </FilterBar>

      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Sản phẩm", "Người đánh giá", "Đánh giá", "Ngày", "Trạng thái", "Thao tác"]}>
            {query.data.content.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="max-w-52 px-3 py-2">
                  {r.productSlug
                    ? <Link href={`/products/${r.productSlug}`} target="_blank" className="font-medium text-brand-link">{r.productName}</Link>
                    : <span className="text-muted-foreground">{r.productName}</span>}
                </td>
                <td className="px-3 py-2">{r.reviewerName}</td>
                <td className="max-w-96 px-3 py-2">
                  <StarRating value={r.rating} />
                  {r.comment ? <p className="mt-1 text-sm whitespace-pre-line">{r.comment}</p> : <p className="mt-1 text-xs text-muted-foreground">(không có nội dung)</p>}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    r.visible ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                    <span className={`size-1.5 rounded-full ${r.visible ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {r.visible ? "Đang hiển thị" : "Đã ẩn"}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.visible
                    ? <ActionButton tone="danger" onClick={() => { setReason(""); setHiding(r); }}>Ẩn</ActionButton>
                    : <ActionButton disabled={setVisible.isPending} onClick={() => setVisible.mutate({ id: r.id, visible: true })}>Hiện lại</ActionButton>}
                </td>
              </tr>
            ))}
          </Table>
          {!query.data.content.length && <p className="py-6 text-center text-sm text-muted-foreground">Không có đánh giá phù hợp.</p>}
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmModal
        isOpen={!!hiding}
        title="Ẩn đánh giá này?"
        tone="warning"
        confirmText="Ẩn đánh giá"
        cancelText="Giữ lại"
        loading={setVisible.isPending}
        onCancel={() => setHiding(null)}
        onConfirm={() => hiding && setVisible.mutate({ id: hiding.id, visible: false, reason: reason.trim() })}
        message={
          <div className="space-y-2">
            <p className="text-sm">
              Đánh giá của <b>{hiding?.reviewerName}</b> ({hiding?.rating} sao) sẽ không còn hiện trên trang sản phẩm và không tính vào điểm trung bình.
              Bạn có thể hiện lại bất cứ lúc nào.
            </p>
            <textarea
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do ẩn (không bắt buộc, lưu vào nhật ký)"
              className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring"
            />
          </div>
        }
      />
    </AdminPage>
  );
}
