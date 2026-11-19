import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Tiêu đề khối: mobile căn trái có thanh nhấn cam + "Xem tất cả"; desktop chữ in hoa căn giữa, gạch chân cam,
 * "Xem tất cả" dạng nút nhỏ ở mép phải.
 */
export function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-8 pb-4 md:relative md:justify-center md:px-0 md:pt-12 md:pb-6">
      <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-neutral-900 md:flex-col md:gap-2 md:text-3xl md:tracking-tight md:text-brand-deep md:uppercase">
        <span aria-hidden className="h-5 w-1.5 rounded-full bg-brand-accent md:hidden" />
        {title}
        <span aria-hidden className="fx-underline hidden h-1 w-14 rounded-full bg-brand-accent md:block" />
      </h2>
      {href && (
        <Link href={href} className="group/all inline-flex items-center gap-1 text-sm font-bold text-brand-link transition hover:text-brand-dark md:absolute md:right-0 md:rounded-full md:bg-white md:px-4 md:py-2 md:shadow-card md:hover:shadow-card-hover">
          Xem tất cả <ArrowRight className="size-3.5 transition group-hover/all:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
