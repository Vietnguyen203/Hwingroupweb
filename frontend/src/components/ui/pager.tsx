"use client";

/** Phân trang phía client cho các danh sách gọi API (page bắt đầu từ 1). */
export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = "rounded-lg border bg-white px-3 py-1.5 text-sm disabled:opacity-40";
  return (
    <div className="flex items-center justify-center gap-3 py-3 text-sm">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Trước</button>
      <span>Trang {page}/{totalPages}</span>
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sau ›</button>
    </div>
  );
}
