"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clapperboard, ExternalLink, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { showToast } from "@/components/ui/toast";
import { PlatformBadge } from "@/components/video/platform-badge";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, errorMessage } from "@/lib/api";
import type { CategoryResponse } from "@/lib/types";
import { safeSourceUrl, safeThumbnailUrl, type VideoResponse, type VideoStatus } from "@/lib/videos";
import { cn } from "@/lib/utils";
import { AdminPage, FilterBar, IconButton, Loading, Select, Table } from "./admin-ui";
import { VideoFormDrawer } from "./video-form-drawer";

const STATUS_STYLE: Record<VideoStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "Đang đăng", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  HIDDEN: { label: "Đang ẩn", className: "bg-slate-100 text-slate-600 ring-slate-200" },
};

/**
 * Quản lý video mạng xã hội: tìm kiếm, lọc theo nền tảng / danh mục / trạng thái, thêm, sửa (bấm vào video), đăng hoặc ẩn, xóa.
 * Thêm / sửa nằm trong ngăn kéo có xem trước nhúng (VideoFormDrawer).
 */
export function AdminVideos() {
  const qc = useQueryClient();
  const { query, filters, setFilter, page, setPage } = useAdminList<VideoResponse>("/api/admin/videos");
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: () => api<CategoryResponse[]>("/api/admin/categories") });
  const [editing, setEditing] = useState<VideoResponse | "new" | null>(null);
  const [deleting, setDeleting] = useState<VideoResponse | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/videos"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VideoStatus }) =>
      api<VideoResponse>(`/api/admin/videos/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: (v) => {
      void refresh();
      showToast({ type: "success", message: v.status === "PUBLISHED" ? `Đã đăng "${v.title}"` : `Đã ẩn "${v.title}"` });
    },
    onError: (err) => showToast({ type: "error", title: "Chưa đổi được trạng thái", message: errorMessage(err) }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/videos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void refresh();
      setDeleting(null);
      showToast({ type: "success", message: "Đã xóa video" });
    },
    onError: (err) => showToast({ type: "error", title: "Chưa xóa được", message: errorMessage(err) }),
  });

  /** Nút thao tác của một video: đăng / ẩn, mở bài gốc, xóa (dùng cho cả bảng và thẻ điện thoại). */
  const actions = (v: VideoResponse) => {
    const source = safeSourceUrl(v.platform, v.sourceUrl);
    return (
          <div className="inline-flex items-center gap-1.5">
            <IconButton
              label={v.status === "PUBLISHED" ? "Ẩn video khỏi trang web" : "Đăng video lên trang web"}
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ id: v.id, status: v.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED" })}
            >
              {v.status === "PUBLISHED" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </IconButton>
            {source && (
              <a href={source} target="_blank" rel="noopener noreferrer" title="Mở bài gốc" aria-label="Mở bài gốc ở tab mới"
                 className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-brand hover:bg-brand-soft hover:text-brand">
                <ExternalLink className="size-4" />
              </a>
            )}
            <IconButton label="Xóa video" tone="danger" onClick={() => setDeleting(v)}>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
    );
  };

  const rows = query.data?.content ?? [];
  const filtering = Object.values(filters).some(Boolean);

  return (
    <AdminPage
      title="Video"
      actions={
        <Button type="button" onClick={() => setEditing("new")} className="gap-2">
          <Plus className="size-4" /> Thêm video
        </Button>
      }
    >
      <FilterBar>
        <Input
          placeholder="Tìm video theo tiêu đề..."
          defaultValue={filters.q ?? ""}
          className="h-10 w-64"
          aria-label="Tìm video theo tiêu đề"
          onKeyDown={(e) => {
            if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim());
          }}
        />
        <Select value={filters.platform ?? ""} onChange={(v) => setFilter("platform", v)}
                options={[["", "Mọi nền tảng"], ["YOUTUBE", "YouTube"], ["TIKTOK", "TikTok"], ["FACEBOOK", "Facebook"]]} />
        <Select value={filters.categoryId ?? ""} onChange={(v) => setFilter("categoryId", v)}
                options={[["", "Mọi danh mục"], ...(categories.data ?? []).map((c) => [c.id, c.name] as [string, string])]} />
        <Select value={filters.status ?? ""} onChange={(v) => setFilter("status", v)}
                options={[["", "Mọi trạng thái"], ["PUBLISHED", "Đang đăng"], ["HIDDEN", "Đang ẩn"]]} />
        {query.data && (
          <div className="ml-auto text-xs font-medium text-slate-500">
            Tổng: <strong className="text-slate-800">{query.data.totalElements}</strong> video
          </div>
        )}
      </FilterBar>

      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p>{errorMessage(query.error)}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => query.refetch()}>Thử lại</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand"><Clapperboard className="size-7" /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{filtering ? "Không có video phù hợp" : "Chưa có video nào"}</h2>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            {filtering ? "Thử đổi từ khóa hoặc bỏ bớt bộ lọc." : "Dán link video Facebook, TikTok hoặc YouTube, gắn sản phẩm để khách vừa xem vừa mua."}
          </p>
          {!filtering && <Button type="button" className="mt-5 gap-2" onClick={() => setEditing("new")}><Plus className="size-4" /> Thêm video đầu tiên</Button>}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
          <Table head={["Video", "Nền tảng", "Sản phẩm", "Thứ tự", "Trạng thái", "Thao tác"]}>
            {rows.map((v) => {
              const thumb = safeThumbnailUrl(v.thumbnailUrl);
              const st = STATUS_STYLE[v.status];
              return (
                <tr key={v.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setEditing(v)} aria-label={`Sửa video ${v.title}`} title="Bấm để sửa video"
                            className="group/edit flex w-full cursor-pointer items-center gap-3 rounded-lg text-left outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa đã kiểm tra (safeThumbnailUrl)
                        <img src={thumb} alt="" className="h-14 w-24 shrink-0 rounded-lg border bg-slate-100 object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border bg-slate-100 text-slate-400"><Clapperboard className="size-5" /></span>
                      )}
                      <span className="block min-w-0">
                        <span className="block max-w-72 truncate font-semibold text-slate-800 transition-colors group-hover/edit:text-brand">{v.title}</span>
                        <span className="block text-xs text-slate-500">{v.category?.name ?? "Chưa chọn danh mục"}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3"><PlatformBadge platform={v.platform} /></td>
                  <td className="px-4 py-3">
                    {v.products.length === 0 ? (
                      <span className="text-xs text-slate-400">Chưa gắn</span>
                    ) : (
                      <span className="block max-w-56 text-sm text-slate-700" title={v.products.map((p) => p.name).join(", ")}>
                        <strong>{v.products.length}</strong> · <span className="text-slate-500">{v.products[0].name}{v.products.length > 1 ? ` +${v.products.length - 1}` : ""}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{v.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", st.className)}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {actions(v)}
                  </td>
                </tr>
              );
            })}
          </Table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((v) => {
              const thumb = safeThumbnailUrl(v.thumbnailUrl);
              const st = STATUS_STYLE[v.status];
              return (
                <li key={v.id} className="rounded-2xl border border-slate-200/90 bg-white p-3">
                  <button type="button" onClick={() => setEditing(v)} aria-label={`Sửa video ${v.title}`} className="flex w-full items-start gap-3 text-left">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa đã kiểm tra (safeThumbnailUrl)
                      <img src={thumb} alt="" className="h-16 w-28 shrink-0 rounded-lg border bg-slate-100 object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border bg-slate-100 text-slate-400"><Clapperboard className="size-5" /></span>
                    )}
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-semibold text-slate-800">{v.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{v.category?.name ?? "Chưa chọn danh mục"} · Thứ tự {v.displayOrder}</span>
                    </span>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={v.platform} />
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", st.className)}>{st.label}</span>
                    <span className="text-xs text-slate-500">{v.products.length ? `${v.products.length} sản phẩm` : "Chưa gắn sản phẩm"}</span>
                    <div className="ml-auto">{actions(v)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {editing && <VideoFormDrawer video={editing === "new" ? null : editing} categories={categories.data ?? []} onClose={() => setEditing(null)} />}

      <ConfirmModal
        isOpen={!!deleting}
        title="Xóa video này?"
        message={<>Video <strong>&ldquo;{deleting?.title}&rdquo;</strong> sẽ bị xóa khỏi web cùng liên kết sản phẩm. Video gốc trên mạng xã hội không bị ảnh hưởng. Muốn tạm ngừng hiển thị, hãy chọn &ldquo;Ẩn&rdquo; thay vì xóa.</>}
        confirmText="Xóa video"
        cancelText="Giữ lại"
        tone="danger"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </AdminPage>
  );
}
