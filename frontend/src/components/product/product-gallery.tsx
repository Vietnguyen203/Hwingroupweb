"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Ảnh sản phẩm: vuốt ngang trên mobile + thumbnail xem nhanh trên desktop. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) return <div className="aspect-square rounded-2xl bg-neutral-100" />;

  const selectImage = (i: number) => {
    setIndex(i);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: i * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Khung ảnh chính */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`${alt} – ảnh ${i + 1}`}
              className="aspect-square w-full shrink-0 snap-center object-cover transition-transform duration-300 hover:scale-105"
            />
          ))}
        </div>
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
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                index === i
                  ? "border-brand shadow-sm scale-105"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-neutral-300"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
