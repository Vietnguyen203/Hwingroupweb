"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, FileCheck2, RefreshCw, ShieldCheck, Trash2, ZoomIn } from "lucide-react";

import { CertificateUploadZone } from "@/components/admin/certificate-upload-zone";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { showToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import type { CertificateResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Tên gợi nhớ dưới ảnh: ảnh mới chỉ có số thứ tự, dữ liệu cũ còn tiêu đề thì dùng tiêu đề. */
const labelOf = (c: CertificateResponse, i: number) => c.title?.trim() || `Ảnh giấy chứng nhận ${i + 1}`;

/**
 * Quản lý giấy chứng nhận: admin chỉ tải ảnh lên (không khai thông tin), ảnh hiện thành thư viện ở trang Chính sách &amp; Pháp lý.
 * Mỗi ảnh có thể ẩn / hiện hoặc xóa.
 */
export function AdminCertificates() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<CertificateResponse | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const nextOrder = useRef(0);

  const { data: certs = [], isLoading, isError, error, refetch, isFetching } = useQuery<CertificateResponse[]>({
    queryKey: ["admin-certificates"],
    queryFn: () => api<CertificateResponse[]>("/api/admin/certificates"),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-certificates"] });
    void qc.invalidateQueries({ queryKey: ["public-certificates"] });
  };

  // Ảnh vừa tải lên -> tạo bản ghi, xếp cuối danh sách
  const create = useMutation({
    mutationFn: (imageUrl: string) => {
      nextOrder.current = Math.max(nextOrder.current, ...certs.map((c) => c.sortOrder)) + 1;
      return api("/api/admin/certificates", { method: "POST", body: { imageUrl, active: true, sortOrder: nextOrder.current } });
    },
    onSuccess: refresh,
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api(`/api/admin/certificates/${id}/toggle`, { method: "PATCH" }),
    onSuccess: refresh,
    onError: (err) => showToast({ message: errorMessage(err), type: "error" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/certificates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      showToast({ message: "Đã xóa ảnh giấy chứng nhận", type: "info" });
    },
    onError: (err) => showToast({ message: errorMessage(err), type: "error" }),
  });

  const visible = certs.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            <ShieldCheck className="size-7 text-emerald-600" />
            Giấy chứng nhận &amp; Hồ sơ pháp lý
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tải ảnh giấy chứng nhận VSATTP, ISO/HACCP, phiếu kiểm nghiệm lên; ảnh hiện ở trang Chính sách &amp; Pháp lý cho khách xem.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto"
          title="Tải lại danh sách"
        >
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Làm mới
        </button>
      </div>

      <CertificateUploadZone
        onUploaded={(url) => create.mutateAsync(url)}
        onFinished={(n) => n > 0 && showToast({ message: n === 1 ? "Đã đăng 1 ảnh giấy chứng nhận" : `Đã đăng ${n} ảnh giấy chứng nhận`, type: "success" })}
      />

      <section aria-label="Danh sách ảnh giấy chứng nhận">
        {!isLoading && !isError && certs.length > 0 && (
          <p className="mb-3 text-sm text-slate-500">
            <strong className="text-slate-800">{certs.length}</strong> ảnh · <strong className="text-emerald-700">{visible}</strong> đang hiển thị trên website
          </p>
        )}

        {isLoading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-[7/10] animate-pulse bg-slate-100" />
                <div className="h-12 animate-pulse border-t border-slate-100 bg-white" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
            Không tải được danh sách: {errorMessage(error)}{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">Thử lại</button>
          </div>
        ) : certs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileCheck2 className="size-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có ảnh giấy chứng nhận nào</p>
            <p className="mt-1 text-xs text-slate-500">Tải ảnh đầu tiên ở khung phía trên.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {certs.map((c, i) => (
              <li key={c.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                <button
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`Phóng to ${labelOf(c, i)}`}
                  className="relative block aspect-[7/10] w-full bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- bản scan admin tải lên */}
                  <img src={c.imageUrl} alt={labelOf(c, i)} loading="lazy"
                       className={cn("size-full object-contain p-2 transition", !c.active && "opacity-40 grayscale")} />
                  {!c.active && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-slate-800/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                      <EyeOff className="size-3" /> Đang ẩn
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/35 text-white opacity-0 transition group-hover:opacity-100">
                    <ZoomIn className="size-7" />
                  </span>
                </button>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800" title={labelOf(c, i)}>{labelOf(c, i)}</p>
                    <p className="text-[11px] text-slate-400">Đăng {new Date(c.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggle.mutate(c.id)}
                      disabled={toggle.isPending}
                      title={c.active ? "Đang hiển thị – bấm để ẩn" : "Đang ẩn – bấm để hiển thị"}
                      aria-label={c.active ? "Ẩn khỏi website" : "Hiển thị trên website"}
                      aria-pressed={c.active}
                      className={cn("rounded-lg p-1.5 transition disabled:opacity-50", c.active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100")}
                    >
                      {c.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(c)}
                      title="Xóa ảnh này"
                      aria-label={`Xóa ${labelOf(c, i)}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ImageLightbox
        images={certs.map((c, i) => ({ url: c.imageUrl, caption: labelOf(c, i) }))}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />

      <ConfirmModal
        isOpen={!!deleting}
        title="Xóa ảnh giấy chứng nhận"
        message="Ảnh này sẽ biến mất khỏi website và không khôi phục được. Bạn chắc chắn muốn xóa?"
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
