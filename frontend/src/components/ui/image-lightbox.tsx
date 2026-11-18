"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxImage = { url: string; caption?: string | null };

/**
 * Xem ảnh phóng to trên nền tối. Có nhiều ảnh thì chuyển bằng nút hoặc phím ← →, Esc để đóng.
 * {@code index = null} là đang đóng; nơi dùng giữ index để mở đúng ảnh.
 */
export function ImageLightbox({ images, index, onIndexChange, onClose }: {
  images: LightboxImage[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const open = index !== null && index >= 0 && index < images.length;
  const count = images.length;

  useEffect(() => {
    if (!open) return;
    const step = (d: number) => onIndexChange((index! + d + count) % count);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) step(-1);
      else if (e.key === "ArrowRight" && count > 1) step(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, count, onClose, onIndexChange]);

  if (!open) return null;
  const current = images[index!];
  const go = (d: number) => onIndexChange((index! + d + count) % count);
  const nav = "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption || "Xem ảnh"}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm animate-in fade-in duration-150 sm:p-6"
    >
      <button type="button" onClick={onClose} aria-label="Đóng"
              className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 sm:top-5 sm:right-5">
        <X className="size-5" />
      </button>

      {count > 1 && (
        <>
          <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); go(-1); }} className={`${nav} left-2 sm:left-5`}>
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); go(1); }} className={`${nav} right-2 sm:right-5`}>
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      <figure onClick={(e) => e.stopPropagation()} className="flex max-h-full max-w-3xl flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng / admin tải lên */}
        <img src={current.url} alt={current.caption || "Ảnh phóng to"} className="max-h-[82vh] w-auto max-w-full rounded-xl bg-white object-contain shadow-2xl" />
        <figcaption className="text-center text-sm text-white/90">
          {current.caption && <span className="font-semibold">{current.caption}</span>}
          {count > 1 && <span className="ml-2 text-white/60">{index! + 1} / {count}</span>}
        </figcaption>
      </figure>
    </div>
  );
}
