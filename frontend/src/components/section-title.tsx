import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Tiêu đề khối: căn trái, chữ thường ở mọi cỡ màn hình; "Xem tất cả" là liên kết ở mép phải, cùng hàng với tiêu đề. */
export function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 pt-8 pb-4 md:px-0 md:pt-12 md:pb-5">
      <h2 className="text-xl font-bold text-brand-deep md:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="group/all inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-link transition hover:text-brand-dark">
          Xem tất cả <ArrowRight className="size-3.5 transition group-hover/all:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
