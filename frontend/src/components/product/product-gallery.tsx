"use client";

import { useState } from "react";

/** Ảnh sản phẩm: vuốt ngang trên mobile + chấm chỉ vị trí. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return <div className="aspect-square bg-neutral-100" />;
  return (
    <div className="relative">
      <div
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`${alt} – ảnh ${i + 1}`} className="aspect-square w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {images.length > 1 && (
        <span className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {index + 1}/{images.length}
        </span>
      )}
    </div>
  );
}
