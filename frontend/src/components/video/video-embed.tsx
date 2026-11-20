"use client";

import { useState } from "react";
import { ExternalLink, Play, VideoOff } from "lucide-react";

import { PLATFORM_LABEL, isVertical, safeEmbedUrl, safeSourceUrl, safeThumbnailUrl, type VideoResponse } from "@/lib/videos";
import { cn } from "@/lib/utils";

type EmbedVideo = Pick<VideoResponse, "platform" | "embedUrl" | "sourceUrl" | "thumbnailUrl" | "title">;

/**
 * Khung xem video mạng xã hội, theo mô hình "ảnh bìa bấm mới tải":
 * - Chưa bấm: chỉ có ảnh bìa + nút phát, KHÔNG nạp iframe của bên thứ ba (nhẹ, bớt theo dõi người dùng).
 * - Bấm phát (hoặc `autoLoad`): dựng iframe chính thức của nền tảng, lazy, có sandbox. Chỉ dựng khi địa chỉ nhúng https
 *   và đúng host của nền tảng (xem safeEmbedUrl); nếu không thì hiện phương án dự phòng.
 * - Luôn có dòng "Mở bài gốc": Facebook / TikTok có thể từ chối nhúng (quyền riêng tư của bài, trình chặn quảng cáo...),
 *   và trang web không phát hiện được điều đó, nên người xem luôn có lối ra bài gốc.
 */
export function VideoEmbed({ video, autoLoad = false, className }: { video: EmbedVideo; autoLoad?: boolean; className?: string }) {
  const [active, setActive] = useState(autoLoad);
  const src = safeEmbedUrl(video.platform, video.embedUrl);
  const source = safeSourceUrl(video.platform, video.sourceUrl);
  const thumb = safeThumbnailUrl(video.thumbnailUrl);
  const vertical = isVertical(video);
  const frame = cn("relative w-full overflow-hidden rounded-2xl bg-neutral-900", vertical ? "mx-auto aspect-[9/16] max-w-[22rem]" : "aspect-video");

  return (
    <div className={className}>
      <div className={frame}>
        {src && active ? (
          <iframe
            src={src}
            title={video.title}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa từ ảnh tải lên hoặc link https đã kiểm tra
              <img src={thumb} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-deep to-brand-dark" aria-hidden />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" aria-hidden />
            {src ? (
              <button
                type="button"
                onClick={() => setActive(true)}
                aria-label={`Phát video: ${video.title}`}
                className="group absolute inset-0 flex items-center justify-center"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-brand shadow-lg transition group-hover:scale-105">
                  <Play className="size-7 translate-x-0.5 fill-current" />
                </span>
              </button>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
                <VideoOff className="size-8" />
                <p className="text-sm">Không thể phát video này trên trang. Bạn mở bài gốc để xem nhé.</p>
              </div>
            )}
          </>
        )}
      </div>

      {source && (
        <p className="mt-2 text-sm text-neutral-600">
          Không xem được?{" "}
          <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-link hover:underline">
            Mở bài gốc trên {PLATFORM_LABEL[video.platform]} <ExternalLink className="size-3.5" />
          </a>
        </p>
      )}
    </div>
  );
}
