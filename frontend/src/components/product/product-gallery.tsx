"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Ảnh sản phẩm: vuốt ngang (mobile) + dải thumbnail. Bấm vào ảnh để xem phóng to toàn màn hình
 * (phím ← → chuyển ảnh, Esc đóng).
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectImage = (i: number) => {
    setIndex(i);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  if (images.length === 0) return <div className="aspect-square rounded-2xl bg-neutral-100" />;

  return (
    <div className="space-y-3">
      {/* Khung ảnh chính */}
      <div className="group relative overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/[0.06]">
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="Xem ảnh phóng to"
              className="aspect-square w-full shrink-0 snap-center cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} – ảnh ${i + 1}`} className="size-full object-cover transition duration-700 ease-out-expo group-hover:scale-105" />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 max-md:opacity-100">
          <ZoomIn className="size-3.5" /> Phóng to
        </span>
        {images.length > 1 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
            {index + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Dải thumbnail bên dưới */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => selectImage(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 md:size-[72px]",
                index === i ? "border-brand shadow-md shadow-brand/20" : "border-transparent opacity-70 hover:border-neutral-300 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <Lightbox images={images} alt={alt} index={index} onIndex={selectImage} onClose={() => setZoomed(false)} />
      )}
    </div>
  );
}

function Lightbox({ images, alt, index, onIndex, onClose }: {
  images: string[];
  alt: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const go = useCallback((delta: number) => onIndex((index + delta + images.length) % images.length), [index, images.length, onIndex]);

  // Phím tắt + khóa cuộn trang nền khi đang xem phóng to
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const nav = "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xs transition hover:bg-white/30";

  return (
    <div role="dialog" aria-modal="true" aria-label="Xem ảnh phóng to" className="fixed inset-0 z-[60] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="line-clamp-1 text-sm font-medium">{alt} · {index + 1}/{images.length}</span>
        <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-white/15"><X className="size-6" /></button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={`${alt} – ảnh ${index + 1}`} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); go(-1); }} className={cn(nav, "left-3 md:left-6")}><ChevronLeft className="size-6" /></button>
            <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); go(1); }} className={cn(nav, "right-3 md:right-6")}><ChevronRight className="size-6" /></button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button key={src} type="button" aria-label={`Ảnh ${i + 1}`} onClick={() => onIndex(i)}
                    className={cn("size-14 shrink-0 overflow-hidden rounded-lg border-2", i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
