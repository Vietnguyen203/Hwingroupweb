import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Logo tạm dựng lại theo màu thương hiệu (biểu tượng xanh lá + chữ HWIN xanh navy).
 * Khi có file logo chính thức: đặt vào public/logo.png và thay phần <svg>/<span> bằng <img>.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="HWIN – Trang chủ" className={cn("flex shrink-0 items-center gap-1", className)}>
      <svg viewBox="0 0 40 32" className="h-7 w-auto" aria-hidden>
        <path d="M2 4h8l6 10 4-6 4 6 6-10h8L26 22h-4l-2-3-2 3h-4Z" fill="var(--brand-green)" />
        <path d="M8 22h6v8H8zM26 22h6v8h-6zM14 25h12v3H14z" fill="var(--brand-green)" opacity=".85" />
      </svg>
      <span className="text-[22px] leading-none font-black tracking-tight text-brand">HWIN</span>
    </Link>
  );
}
