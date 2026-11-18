"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn } from "lucide-react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { api } from "@/lib/api";
import type { CertificateResponse } from "@/lib/types";

/**
 * Thư viện ảnh giấy chứng nhận (do admin tải lên) ở trang Chính sách &amp; Pháp lý: lưới ảnh khổ dọc, bấm để phóng to và lướt xem các ảnh.
 * Chỉ ảnh đang hiển thị được backend trả về.
 */
export function CertificateGallery() {
  const [viewing, setViewing] = useState<number | null>(null);
  const { data: certs = [], isLoading, isError, refetch } = useQuery<CertificateResponse[]>({
    queryKey: ["public-certificates"],
    queryFn: () => api<CertificateResponse[]>("/api/certificates"),
  });

  if (isLoading) {
    return (
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="aspect-[7/10] animate-pulse rounded-2xl bg-neutral-200" />
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        Không tải được hồ sơ chứng nhận.{" "}
        <button type="button" onClick={() => refetch()} className="font-semibold text-brand underline">Thử lại</button>
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
        Hồ sơ chứng nhận đang được cập nhật.
      </div>
    );
  }

  const label = (c: CertificateResponse, i: number) => c.title?.trim() || `Giấy chứng nhận ${i + 1}`;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {certs.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setViewing(i)}
              aria-label={`Phóng to ${label(c, i)}`}
              className="group block w-full text-left"
            >
              <span className="relative block aspect-[7/10] overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-xs transition duration-300 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- bản scan do admin tải lên */}
                <img src={c.imageUrl} alt={label(c, i)} loading="lazy" className="size-full object-contain p-2 transition duration-500 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-900/45 text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                  <ZoomIn className="size-7" />
                  <span className="text-xs font-semibold">Bấm để phóng to</span>
                </span>
              </span>
              {c.title?.trim() && (
                <span className="mt-2 block line-clamp-2 text-center text-xs font-semibold text-neutral-700 group-hover:text-brand">{c.title.trim()}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <ImageLightbox
        images={certs.map((c) => ({ url: c.imageUrl, caption: c.title?.trim() || null }))}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
