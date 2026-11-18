import Link from "next/link";

/** Phân trang đơn giản bằng link (giữ nguyên các tham số khác trên URL). */
export function Pagination({ basePath, params, page, totalPages }: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number; // 0-based
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    qs.set("page", String(p + 1));
    return `${basePath}?${qs.toString()}`;
  };
  return (
    <nav className="flex items-center justify-center gap-3 py-6 text-sm" aria-label="Phân trang">
      {page > 0 ? <Link className="rounded-full bg-white px-5 py-2.5 font-semibold shadow-card ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:text-brand hover:shadow-card-hover" href={href(page - 1)}>‹ Trước</Link> : <span />}
      <span className="font-semibold text-neutral-600">Trang {page + 1}/{totalPages}</span>
      {page < totalPages - 1 ? <Link className="rounded-full bg-white px-5 py-2.5 font-semibold shadow-card ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:text-brand hover:shadow-card-hover" href={href(page + 1)}>Sau ›</Link> : <span />}
    </nav>
  );
}
