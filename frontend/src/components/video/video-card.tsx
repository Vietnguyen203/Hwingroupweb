"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard, ExternalLink, Play, ShoppingBag } from "lucide-react";

import { PlatformBadge } from "@/components/video/platform-badge";
import { VideoModal } from "@/components/video/video-modal";
import { formatVnd } from "@/lib/format";
import { PLATFORM_LABEL, safeSourceUrl, safeThumbnailUrl, type VideoResponse } from "@/lib/videos";

export function VideoCard({ video }: { video: VideoResponse }) {
  const [modalOpen, setModalOpen] = useState(false);
  const thumb = safeThumbnailUrl(video.thumbnailUrl);
  const source = safeSourceUrl(video.platform, video.sourceUrl);
  const firstProduct = video.products[0];

  return (
    <>
      <article className="group/card flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.05] transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover">
        {/* Khung ảnh bìa video */}
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa video đã kiểm tra an toàn
            <img
              src={thumb}
              alt=""
              className="size-full object-cover transition duration-500 ease-out-expo group-hover/card:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-deep to-brand-dark text-white/50">
              <Clapperboard className="size-12" />
            </div>
          )}

          {/* Lớp phủ chuyển màu tối */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Huy hiệu nền tảng (góc trên trái) */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <PlatformBadge platform={video.platform} className="bg-white/90 shadow-xs backdrop-blur-xs" />
          </div>

          {/* Danh mục (góc trên phải) */}
          {video.category && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                {video.category.name}
              </span>
            </div>
          )}

          {/* Nút phát ở giữa - bấm mở hộp thoại nhúng ngay trên web */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label={`Xem video: ${video.title}`}
            className="absolute inset-0 flex items-center justify-center group/play cursor-pointer"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-brand/90 text-white shadow-lg transition duration-200 group-hover/play:scale-110 group-hover/play:bg-brand">
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
          </button>
        </div>

        {/* Nội dung thẻ */}
        <div className="flex flex-1 flex-col p-4">
          {/* Tiêu đề video */}
          <h3 className="line-clamp-2 text-base font-bold text-neutral-900 transition group-hover/card:text-brand">
            <Link href={`/videos/${video.slug}`}>{video.title}</Link>
          </h3>

          {/* Mô tả ngắn */}
          {video.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-600">
              {video.description}
            </p>
          )}

          {/* Sản phẩm gắn kèm (nếu có) */}
          {firstProduct && (
            <div className="mt-3.5 rounded-xl border border-neutral-100 bg-neutral-50/80 p-2.5">
              <div className="flex items-center gap-2.5">
                {firstProduct.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend
                  <img src={firstProduct.imageUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-neutral-400">
                    <ShoppingBag className="size-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold tracking-wider text-brand uppercase">Món trong video</span>
                  <Link
                    href={`/products/${firstProduct.slug}`}
                    className="block truncate text-xs font-bold text-neutral-800 transition hover:text-brand"
                  >
                    {firstProduct.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-red">{formatVnd(firstProduct.price)}</span>
                    {video.products.length > 1 && (
                      <span className="text-[10px] font-medium text-neutral-500">
                        +{video.products.length - 1} món
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chân thẻ: nút hành động tách riêng */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white cursor-pointer"
            >
              <Play className="size-3 fill-current" /> Xem video
            </button>

            <div className="flex items-center gap-2">
              {firstProduct && (
                <Link
                  href={`/products/${firstProduct.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-brand/40 hover:text-brand"
                >
                  Xem món
                </Link>
              )}

              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Mở bài gốc trên ${PLATFORM_LABEL[video.platform]}`}
                  aria-label={`Mở bài gốc trên ${PLATFORM_LABEL[video.platform]}`}
                  className="inline-flex size-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-brand"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Hộp thoại xem video nhúng ngay trên web */}
      {modalOpen && <VideoModal video={video} onClose={() => setModalOpen(false)} />}
    </>
  );
}
