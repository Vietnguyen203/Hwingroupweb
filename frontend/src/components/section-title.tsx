import Link from "next/link";

/** Tiêu đề khối: mobile căn trái + "Xem tất cả ›" xanh; desktop chữ in hoa navy căn giữa. */
export function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-7 pb-3 md:justify-center md:px-0 md:pt-10 md:pb-5 md:relative">
      <h2 className="text-lg font-bold text-neutral-900 md:text-2xl md:text-brand md:uppercase">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-brand-link md:absolute md:right-0">
          Xem tất cả ›
        </Link>
      )}
    </div>
  );
}
