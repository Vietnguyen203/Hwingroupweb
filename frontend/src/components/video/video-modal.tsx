"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, ExternalLink, ShoppingBag, X } from "lucide-react";

import { PlatformBadge } from "@/components/video/platform-badge";
import { VideoEmbed } from "@/components/video/video-embed";
import { formatVnd } from "@/lib/format";
import { PLATFORM_LABEL, safeSourceUrl, type VideoResponse } from "@/lib/videos";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hộp thoại xem video trực tiếp trên trang:
 * - Nhúng video (VideoEmbed), mở bài gốc trên mạng xã hội, danh sách sản phẩm gắn kèm.
 * - Khóa cuộn trang khi mở, bấm Esc hoặc vùng nền mờ để đóng, giữ focus an toàn.
 */
export function VideoModal({ video, onClose }: { video: VideoResponse; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const source = safeSourceUrl(video.platform, video.sourceUrl);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Nền mờ */}
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Nội dung hộp thoại */}
      <div
        ref={panelRef}
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* Thanh tiêu đề */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 pr-3">
            <PlatformBadge platform={video.platform} />
            {video.category && (
              <span className="hidden rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand sm:inline-block">
                {video.category.name}
              </span>
            )}
            <h2 id={titleId} className="truncate text-sm font-bold text-neutral-900 sm:text-base">
              {video.title}
            </h2>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Thân hộp thoại cuộn được */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Khung nhúng video */}
          <VideoEmbed video={video} autoLoad={true} className="mb-4" />

          {/* Mô tả video */}
          {video.description && (
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
              {video.description}
            </p>
          )}

          {/* Sản phẩm trong video */}
          {video.products.length > 0 && (
            <div className="mt-5 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-brand-deep">
                  <ShoppingBag className="size-4 text-brand" />
                  Món ngon trong video ({video.products.length})
                </h3>
              </div>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {video.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5 shadow-2xs transition hover:border-brand/40"
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend
                      <img src={p.imageUrl} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">
                        Chưa có ảnh
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={onClose}
                        className="block truncate text-sm font-semibold text-neutral-900 hover:text-brand"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-red">{formatVnd(p.price)}</span>
                        {p.inStock ? (
                          <span className="text-[11px] font-medium text-emerald-600">Còn hàng</span>
                        ) : (
                          <span className="text-[11px] font-medium text-neutral-400">Tạm hết</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={onClose}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition hover:bg-brand hover:text-white"
                      title="Xem sản phẩm"
                      aria-label={`Xem sản phẩm ${p.name}`}
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Chân hộp thoại */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-3 sm:px-6">
          <Link
            href={`/videos/${video.slug}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline sm:text-sm"
          >
            Mở trang chi tiết video <ArrowRight className="size-3.5" />
          </Link>

          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand hover:underline sm:text-sm"
            >
              Xem trên {PLATFORM_LABEL[video.platform]} <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
