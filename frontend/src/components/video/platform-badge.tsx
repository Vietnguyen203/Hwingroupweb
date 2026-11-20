import { PLATFORM_DOT, PLATFORM_LABEL, type VideoPlatform } from "@/lib/videos";
import { cn } from "@/lib/utils";

/** Nhãn nền tảng (chấm màu + tên). Dùng cho bảng admin, thẻ video và trang chi tiết. */
export function PlatformBadge({ platform, className }: { platform: VideoPlatform; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", PLATFORM_DOT[platform])} />
      {PLATFORM_LABEL[platform]}
    </span>
  );
}
