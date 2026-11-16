import Link from "next/link";

export function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-6 pb-3">
      <h2 className="border-l-4 border-brand pl-2 text-lg font-bold uppercase">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-brand">
          Xem tất cả ›
        </Link>
      )}
    </div>
  );
}
