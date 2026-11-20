"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { PlatformBadge } from "@/components/video/platform-badge";
import { VideoEmbed } from "@/components/video/video-embed";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse } from "@/lib/types";
import {
  PLATFORM_LABEL,
  guessPlatform,
  safeThumbnailUrl,
  type VideoPlatform,
  type VideoPreviewResponse,
  type VideoResponse,
  type VideoStatus,
} from "@/lib/videos";
import { cn } from "@/lib/utils";
import { Select } from "./admin-ui";
import { VideoProductPicker, type SelectedProduct } from "./video-product-picker";

const MAX_PRODUCTS = 20;
const label = "mb-1.5 block text-sm font-semibold text-slate-800";
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

/**
 * Ngăn kéo thêm / sửa video. Admin chỉ dán link gốc: backend nhận ra nền tảng và dựng địa chỉ nhúng; bên phải là
 * bản xem trước đúng như khách sẽ thấy (xem trước có thể bấm phát để thử nhúng thật). Không có ô nhập HTML / iframe.
 */
export function VideoFormDrawer({ video, categories, onClose }: {
  video: VideoResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(video?.title ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [sourceUrl, setSourceUrl] = useState(video?.sourceUrl ?? "");
  const [platform, setPlatform] = useState<VideoPlatform | "">("");
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl ?? "");
  const [categoryId, setCategoryId] = useState(video?.category?.id ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(video?.displayOrder ?? 0));
  const [status, setStatus] = useState<VideoStatus>(video?.status ?? "PUBLISHED");
  const [products, setProducts] = useState<SelectedProduct[]>(
    (video?.products ?? []).map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, price: p.price })),
  );
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; sourceUrl?: string }>({});

  // Esc đóng ngăn kéo (trừ khi đang mở hộp chọn sản phẩm)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !picking) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, picking]);

  // Gõ xong link (chờ 0,5 giây) mới hỏi backend để xem trước
  const [debouncedUrl, setDebouncedUrl] = useState(sourceUrl);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUrl(sourceUrl.trim()), 500);
    return () => clearTimeout(t);
  }, [sourceUrl]);
  const preview = useQuery({
    queryKey: ["admin-video-preview", debouncedUrl],
    queryFn: () => api<VideoPreviewResponse>("/api/admin/videos/preview", { method: "POST", body: { sourceUrl: debouncedUrl } }),
    enabled: debouncedUrl.length >= 12,
    retry: false,
    staleTime: 60_000,
  });
  const waiting = sourceUrl.trim() !== debouncedUrl || (preview.isFetching && !preview.data);
  const detected = preview.data && sourceUrl.trim() === debouncedUrl ? preview.data : null;
  const guess = guessPlatform(sourceUrl);

  const save = useMutation({
    mutationFn: () =>
      api<VideoResponse>(video ? `/api/admin/videos/${video.id}` : "/api/admin/videos", {
        method: video ? "PUT" : "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          sourceUrl: sourceUrl.trim(),
          platform: platform || undefined,
          thumbnailUrl: thumbnailUrl.trim(),
          categoryId: categoryId || null,
          displayOrder: Math.max(0, Number.parseInt(displayOrder, 10) || 0),
          status,
          productIds: products.map((p) => p.id),
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "/api/admin/videos"] });
      showToast({ type: "success", message: video ? "Đã cập nhật video" : status === "PUBLISHED" ? "Đã thêm và đăng video" : "Đã lưu video (đang ẩn)" });
      onClose();
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Vui lòng nhập tiêu đề";
    if (!sourceUrl.trim()) next.sourceUrl = "Vui lòng dán link video";
    setErrors(next);
    if (Object.keys(next).length === 0) save.mutate();
  }

  const move = (i: number, d: -1 | 1) =>
    setProducts((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const thumbForPreview = safeThumbnailUrl(thumbnailUrl) ?? detected?.thumbnailUrl ?? null;
  const uploadedThumb = thumbnailUrl.startsWith("/") ? [thumbnailUrl] : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label={video ? "Sửa video" : "Thêm video"}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-5xl flex-col bg-slate-50 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{video ? "Sửa video" : "Thêm video mới"}</h2>
            <p className="text-sm text-slate-500">Video vẫn nằm ở mạng xã hội gốc; web chỉ nhúng và dẫn tới sản phẩm.</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-5 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section className="space-y-4 rounded-xl border bg-white p-4">
              <div>
                <label htmlFor="video-url" className={label}>Link video hoặc bài đăng</label>
                <Input
                  id="video-url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="Dán link video Facebook, TikTok hoặc YouTube"
                  aria-invalid={!!errors.sourceUrl || (!!preview.error && !waiting)}
                  className="h-11"
                />
                <div className="mt-2 min-h-6 text-sm" aria-live="polite">
                  {errors.sourceUrl ? (
                    <span className="text-destructive">{errors.sourceUrl}</span>
                  ) : !sourceUrl.trim() ? (
                    <span className="text-slate-500">Mở video trên Facebook, TikTok hoặc YouTube rồi sao chép link đầy đủ trên thanh địa chỉ.</span>
                  ) : waiting ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><Loader2 className="size-4 animate-spin" /> Đang kiểm tra link…{guess ? ` (${PLATFORM_LABEL[guess]})` : ""}</span>
                  ) : preview.error ? (
                    <span className="inline-flex items-start gap-1.5 text-destructive"><CircleAlert className="mt-0.5 size-4 shrink-0" /> {errorMessage(preview.error)}</span>
                  ) : detected ? (
                    <span className="inline-flex items-center gap-2 text-emerald-700"><CircleCheck className="size-4" /> Link hợp lệ · nhận ra là <PlatformBadge platform={detected.platform} /></span>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="video-title" className={label}>Tiêu đề</label>
                <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="VD: Cách chiên chả lụa giòn ngon" aria-invalid={!!errors.title} className="h-11" />
                {errors.title && <p className="mt-1.5 text-sm text-destructive">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="video-desc" className={label}>Mô tả <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
                <textarea id="video-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} rows={4}
                          placeholder="Vài câu giới thiệu để khách hiểu video nói về gì" className={cn(field, "py-2.5")} />
              </div>
            </section>

            <section className="space-y-4 rounded-xl border bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Danh mục</label>
                  <Select className="w-full" value={categoryId} onChange={setCategoryId}
                          options={[["", "Không chọn danh mục"], ...categories.map((c) => [c.id, c.name] as [string, string])]} />
                </div>
                <div>
                  <label htmlFor="video-order" className={label}>Thứ tự hiển thị</label>
                  <Input id="video-order" type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className="h-10" />
                  <p className="mt-1 text-xs text-slate-500">Số nhỏ hiện trước.</p>
                </div>
              </div>

              <div>
                <span className={label}>Ảnh bìa <span className="font-normal text-slate-400">(không bắt buộc; YouTube tự có ảnh bìa)</span></span>
                <div className="flex flex-wrap items-start gap-4">
                  <ImageUploader value={uploadedThumb} onChange={(urls) => setThumbnailUrl(urls[0] ?? "")} max={1} />
                  <div className="min-w-0 flex-1 sm:min-w-60">
                    <Input value={thumbnailUrl.startsWith("/") ? "" : thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)}
                           placeholder="Hoặc dán link ảnh bắt đầu bằng https://" className="h-10" aria-label="Link ảnh bìa" />
                  </div>
                </div>
              </div>

              <details className="rounded-lg bg-slate-50 p-3 text-sm">
                <summary className="cursor-pointer font-medium text-slate-700">Tùy chọn nâng cao: chọn nền tảng thủ công</summary>
                <p className="mt-2 text-slate-600">Thường không cần: hệ thống tự nhận ra nền tảng từ link. Nền tảng chọn ở đây phải khớp với link, nếu không sẽ bị từ chối.</p>
                <div className="mt-2 w-48">
                  <Select className="w-full" value={platform} onChange={(v) => setPlatform(v as VideoPlatform | "")}
                          options={[["", "Tự nhận ra"], ["YOUTUBE", "YouTube"], ["TIKTOK", "TikTok"], ["FACEBOOK", "Facebook"]]} />
                </div>
              </details>
            </section>

            <section className="space-y-3 rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Sản phẩm trong video</h3>
                  <p className="text-xs text-slate-500">Khách xem video sẽ thấy và bấm vào các sản phẩm này để mua.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setPicking(true)} className="gap-1.5">
                  <Plus className="size-4" /> {products.length ? "Thay đổi" : "Chọn sản phẩm"}
                </Button>
              </div>
              {products.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-500">Chưa gắn sản phẩm nào.</p>
              ) : (
                <ol className="space-y-2">
                  {products.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-slate-50/60 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong form admin */}
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-11 shrink-0 rounded-lg bg-slate-100 object-cover" /> : <span className="size-11 shrink-0 rounded-lg bg-slate-100" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{p.name}</span>
                        <span className="text-xs text-slate-500">{formatVnd(p.price)}</span>
                      </span>
                      <button type="button" aria-label="Đưa lên" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="size-4" /></button>
                      <button type="button" aria-label="Đưa xuống" disabled={i === products.length - 1} onClick={() => move(i, 1)} className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="size-4" /></button>
                      <button type="button" aria-label={`Gỡ ${p.name}`} onClick={() => setProducts((l) => l.filter((x) => x.id !== p.id))} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><X className="size-4" /></button>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-xl border bg-white p-4">
              <span className={label}>Hiển thị trên web</span>
              <div role="radiogroup" aria-label="Trạng thái" className="grid gap-2 sm:grid-cols-2">
                {([["PUBLISHED", "Đăng ngay", "Khách thấy video trong thư viện."], ["HIDDEN", "Lưu nháp (ẩn)", "Chỉ admin thấy, đăng sau."]] as const).map(([v, t, d]) => (
                  <label key={v} className={cn("flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition has-checked:border-brand has-checked:bg-brand-soft")}>
                    <input type="radio" name="status" value={v} checked={status === v} onChange={() => setStatus(v)} className="mt-1 accent-brand" />
                    <span><span className="block font-semibold text-slate-800">{t}</span><span className="text-slate-500">{d}</span></span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Xem trước</h3>
              {detected ? (
                <div className="space-y-3">
                  <PlatformBadge platform={detected.platform} />
                  <VideoEmbed key={detected.embedUrl} video={{ platform: detected.platform, embedUrl: detected.embedUrl, sourceUrl: detected.sourceUrl, thumbnailUrl: thumbForPreview, title: title.trim() || "Xem trước video" }} />
                  <p className="text-xs text-slate-500">Bấm nút phát để thử nhúng thật. Nếu video không phát được ở đây, khách vẫn thấy ảnh bìa và nút mở bài gốc.</p>
                  <p className="text-sm font-semibold text-slate-800">{title.trim() || <span className="font-normal text-slate-400">Chưa có tiêu đề</span>}</p>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">Dán link hợp lệ để xem trước video tại đây.</p>
              )}
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-white px-5 py-3">
          <p className="min-w-0 flex-1 text-sm text-destructive" role="alert">{save.error ? errorMessage(save.error) : ""}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : video ? "Lưu thay đổi" : status === "PUBLISHED" ? "Thêm và đăng" : "Lưu nháp"}</Button>
          </div>
        </footer>
      </form>

      {picking && (
        <VideoProductPicker selected={products} max={MAX_PRODUCTS} onClose={() => setPicking(false)}
                            onApply={(list) => { setProducts(list); setPicking(false); }} />
      )}
    </div>
  );
}
