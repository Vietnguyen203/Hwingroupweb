import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Biểu tượng Phúc Vị (mũ đầu bếp trên chiếc tô), tách từ logo gốc thành PNG nền trong (public/images):
 * `gold` (vàng có độ bóng) cho nền đỏ đô, `red` (đỏ đô một màu) cho nền sáng.
 */
export function LogoMark({ className, tone = "red", priority = false }: { className?: string; tone?: "gold" | "red"; priority?: boolean }) {
  return (
    <Image
      src={tone === "gold" ? "/images/logo-phucvi-mark-gold.png" : "/images/logo-phucvi-mark-red.png"}
      alt=""
      aria-hidden
      width={280}
      height={290}
      priority={priority}
      className={cn("w-auto", className)}
    />
  );
}

/**
 * Logo Phúc Vị Foods.
 * - Mặc định (header, ngăn kéo menu): biểu tượng + chữ "PHÚC VỊ / FOODS" dựng bằng chữ để đọc rõ ở cỡ nhỏ.
 * - `full`: nguyên logo gốc (biểu tượng, tên, khẩu hiệu viết tay) dùng ở chân trang.
 * `tone="light"` dành cho nền đỏ đô (vàng); mặc định dành cho nền sáng (đỏ đô).
 */
export function Logo({ className, tone = "default", full = false }: { className?: string; tone?: "default" | "light"; full?: boolean }) {
  const light = tone === "light";
  const gold = "bg-gradient-to-b from-[#f6e6ad] via-[#e3b04b] to-[#b88a4a] bg-clip-text text-transparent";
  return (
    <Link href="/" aria-label={`${siteConfig.name} – Trang chủ`} className={cn("flex shrink-0 items-center gap-2 md:gap-2.5", className)}>
      {full ? (
        <Image
          src={light ? "/images/logo-phucvi-gold.png" : "/images/logo-phucvi-red.png"}
          alt={`${siteConfig.name} – ${siteConfig.tagline}`}
          width={720}
          height={634}
          className="h-auto w-full"
        />
      ) : (
        <>
          <LogoMark tone={light ? "gold" : "red"} className="h-8 md:h-10" priority={!light} />
          <span className="flex flex-col items-start">
            <span className={cn("font-logo-serif text-[1rem] leading-none font-black tracking-wide md:text-[1.35rem]", light ? gold : "text-brand-deep")}>PHÚC VỊ</span>
            <span className={cn("font-logo-serif mt-0.5 text-[0.5rem] leading-none font-extrabold tracking-[0.4em] md:mt-1 md:text-[0.6rem] md:tracking-[0.45em]", light ? "text-brand-honey" : "text-brand")}>
              FOODS
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
