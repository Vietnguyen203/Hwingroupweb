"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";

import { IMAGE_ACCEPT, prepareImage, uploadImage, validateImage } from "@/lib/image";
import { cn } from "@/lib/utils";

const UPLOAD_ENDPOINT = "/api/admin/uploads";
/** Số ảnh tối đa mỗi lần chọn, tránh bấm nhầm cả thư mục. */
const MAX_BATCH = 20;

/**
 * Khung tải ảnh giấy chứng nhận: bấm chọn (nhiều ảnh cùng lúc), kéo-thả, hoặc chụp bằng camera (điện thoại).
 * Mỗi ảnh được thu nhỏ nếu quá lớn, tải lên rồi gọi {@code onUploaded(url)} để nơi dùng tạo bản ghi; ảnh nào lỗi thì báo riêng,
 * các ảnh còn lại vẫn tiếp tục. Chỉ nhận JPG, PNG, WebP tối đa 5MB (backend kiểm tra lại).
 */
export function CertificateUploadZone({ onUploaded, onFinished }: {
  onUploaded: (url: string) => Promise<unknown>;
  /** Gọi sau khi xử lý xong cả lượt chọn; {@code uploaded} là số ảnh thành công. */
  onFinished?: (uploaded: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const busy = progress !== null;

  async function handle(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0 || busy) return;
    const batch = files.slice(0, MAX_BATCH);
    const errs: string[] = files.length > batch.length ? [`Mỗi lần chỉ tải tối đa ${MAX_BATCH} ảnh; ${files.length - batch.length} ảnh còn lại đã bỏ qua.`] : [];
    setErrors([]);
    setProgress({ done: 0, total: batch.length });
    let ok = 0;
    for (const picked of batch) {
      try {
        const prepared = await prepareImage(picked);
        const problem = validateImage(prepared);
        if (problem) throw new Error(problem);
        await onUploaded(await uploadImage(prepared, UPLOAD_ENDPOINT));
        ok += 1;
      } catch (e) {
        errs.push(`${picked.name}: ${e instanceof Error ? e.message : "Tải ảnh thất bại"}`);
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }
    setErrors(errs);
    setProgress(null);
    onFinished?.(ok);
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = ""; // cho phép chọn lại đúng tệp vừa chọn
    void handle(files);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handle(e.dataTransfer.files); }}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8",
          dragging ? "border-emerald-500 bg-emerald-50" : "border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white hover:border-emerald-400",
        )}
      >
        {busy ? (
          <div role="status" className="mx-auto flex max-w-sm flex-col items-center gap-3 text-emerald-800">
            <Loader2 className="size-9 animate-spin" />
            <p className="text-sm font-bold">Đang tải ảnh {Math.min(progress.done + 1, progress.total)} / {progress.total}…</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
              <UploadCloud className="size-7" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">{dragging ? "Thả ảnh để tải lên" : "Kéo ảnh giấy chứng nhận vào đây"}</p>
              <p className="mt-1 text-xs text-slate-500">Chọn được nhiều ảnh cùng lúc · JPG, PNG, WebP · tối đa 5MB mỗi ảnh</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]">
                <ImagePlus className="size-4" /> Chọn ảnh từ máy
              </button>
              <button type="button" onClick={() => cameraInput.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:hidden">
                <Camera className="size-4" /> Chụp bằng camera
              </button>
            </div>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <ul className="space-y-0.5">
            {errors.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
          <button type="button" onClick={() => setErrors([])} aria-label="Đóng thông báo lỗi" className="shrink-0 rounded-full p-0.5 hover:bg-rose-100">
            <X className="size-4" />
          </button>
        </div>
      )}

      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} multiple className="hidden" onChange={pick} />
      <input ref={cameraInput} type="file" accept={IMAGE_ACCEPT} capture="environment" className="hidden" onChange={pick} />
    </div>
  );
}
