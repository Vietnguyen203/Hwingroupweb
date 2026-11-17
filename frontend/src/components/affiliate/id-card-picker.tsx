"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export const ID_CARD_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/** Kiểm tra nhanh ở trình duyệt (backend vẫn kiểm tra lại định dạng và dung lượng). */
export function idCardFileError(file: File): string | null {
  if (!ACCEPT.includes(file.type)) return "Chỉ nhận ảnh JPG, PNG hoặc WebP";
  if (file.size > ID_CARD_MAX_BYTES) return "Ảnh tối đa 5MB";
  return null;
}

/** Ô chọn 1 mặt CCCD: bấm để chọn ảnh, hiện xem trước, có nút xóa. Ảnh chỉ được gửi lên khi bấm "Gửi đăng ký". */
export function IdCardPicker({ label, file, onChange, onError }: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  onError: (message: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Tạo/hủy URL xem trước theo file đang chọn (tránh rò bộ nhớ).
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ URL xem trước với file, cần state
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">{label} <span className="text-destructive">*</span></span>
      <div className="relative">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-[1.6] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition hover:border-brand"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước cục bộ (blob:)
            <img src={preview} alt={label} className="size-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm"><ImagePlus className="size-7" />Chọn ảnh</span>
          )}
        </button>
        {file && (
          <button
            type="button"
            aria-label={`Xóa ${label}`}
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!f) return;
          const err = idCardFileError(f);
          onError(err);
          if (!err) onChange(f);
        }}
      />
    </div>
  );
}
