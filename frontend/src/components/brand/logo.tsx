import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Logo HWIN chính thức (public/images): logo-hwin.png chữ navy cho nền sáng,
 * logo-hwin-light.png chữ trắng cho nền navy (footer). Ảnh gốc: logo-hwin.jpg.
 */
export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <Link href="/" aria-label="HWIN – Trang chủ" className={cn("flex shrink-0 items-center", className)}>
      <Image
        src={tone === "light" ? "/images/logo-hwin-light.png" : "/images/logo-hwin.png"}
        alt="HWIN"
        width={295}
        height={191}
        priority={tone === "default"}
        className="h-11 w-auto"
      />
    </Link>
  );
}
