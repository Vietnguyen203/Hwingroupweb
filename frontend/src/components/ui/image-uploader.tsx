"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

import { IMAGE_ACCEPT, prepareImage, uploadImage, validateImage } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * Tải ảnh lên (admin): chọn nhiều ảnh cùng lúc hoặc kéo-thả, xem trước ngay, xóa ảnh, đặt làm ảnh chính (ảnh đầu).
 * Ảnh quá lớn tự thu nhỏ trước khi gửi. {@code max = 1} dùng cho ảnh đơn (biểu tượng danh mục).
 * Giá trị là danh sách URL do backend trả về (POST {endpoint}); nơi dùng tự quyết định lưu ra sao.
 */
export function ImageUploader({ value, onChange, max, endpoint = "/api/admin/uploads", onError, tileClassName, hint }: {
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  endpoint?: string;
  onError?: (message: string | null) => void;
  tileClassName?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(value); // giá trị mới nhất khi nhiều ảnh lần lượt tải xong
  useEffect(() => { latest.current = value; }, [value]);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const single = max === 1;
  const tile = cn("relative aspect-square overflow-hidden rounded-xl border bg-slate-50", single ? "size-24" : "size-28", tileClassName);

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    const free = single ? 1 : max - latest.current.length;
    if (free <= 0) {
      onError?.(`Tối đa ${max} ảnh. Xóa bớt ảnh trước khi thêm.`);
      return;
    }
    const chosen = files.slice(0, free);
    onError?.(files.length > free ? `Chỉ thêm được ${free} ảnh nữa (tối đa ${max}); phần còn lại đã bỏ qua.` : null);
    setUploading((n) => n + chosen.length);
    for (const picked of chosen) {
      try {
        const prepared = await prepareImage(picked);
        const err = validateImage(prepared);
        if (err) throw new Error(`${picked.name}: ${err}`);
        const url = await uploadImage(prepared, endpoint);
        latest.current = single ? [url] : [...latest.current, url];
        onChange(latest.current);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Tải ảnh thất bại");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makeMain = (i: number) => onChange([value[i], ...value.filter((_, idx) => idx !== i)]);
  const canAdd = single ? true : value.length + uploading < max;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer.files); }}
      className={cn("rounded-xl border-2 border-dashed p-3 transition", dragging ? "border-brand bg-brand/5" : "border-slate-200")}
    >
      <ul className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <li key={`${url}-${i}`} className={cn(tile, "group")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh admin vừa tải lên */}
            <img src={url} alt={`Ảnh ${i + 1}`} className="size-full object-cover" />
            {!single && i === 0 && (
              <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white"><Star className="size-3 fill-white" /> Ảnh chính</span>
            )}
            <button type="button" aria-label={`Xóa ảnh ${i + 1}`} onClick={() => remove(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/65 p-1 text-white opacity-90 transition hover:bg-red-600">
              <X className="size-3.5" />
            </button>
            {!single && i > 0 && (
              <button type="button" onClick={() => makeMain(i)}
                      className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
                Đặt làm ảnh chính
              </button>
            )}
          </li>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <li key={`up-${i}`} className={cn(tile, "flex items-center justify-center text-slate-400")} aria-label="Đang tải ảnh">
            <Loader2 className="size-6 animate-spin" />
          </li>
        ))}
        {canAdd && (
          <li>
            <button type="button" onClick={() => input.current?.click()}
                    className={cn(tile, "flex flex-col items-center justify-center gap-1 border-dashed text-slate-500 transition hover:border-brand hover:text-brand")}>
              <ImagePlus className="size-6" />
              <span className="text-[11px] font-semibold">{single ? (value.length ? "Đổi ảnh" : "Tải ảnh lên") : "Thêm ảnh"}</span>
            </button>
          </li>
        )}
      </ul>
      <p className="mt-2 text-xs text-slate-500">{hint ?? "Bấm để chọn (có thể chọn nhiều ảnh) hoặc kéo ảnh vào đây · JPG, PNG, WebP tối đa 5MB, ảnh lớn tự thu nhỏ."}</p>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={!single}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          void addFiles(files);
        }}
      />
    </div>
  );
}
