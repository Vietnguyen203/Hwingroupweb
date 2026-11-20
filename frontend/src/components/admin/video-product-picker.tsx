"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";

/** Sản phẩm đã chọn gắn với video (đủ thông tin để hiện lại mà không cần gọi API). */
export type SelectedProduct = { id: string; name: string; imageUrl: string | null; price: number };

type ProductRow = { id: string; name: string; price: number; effectivePrice?: number; images: string[] };

/**
 * Hộp thoại chọn sản phẩm cho video: tìm theo tên, tick chọn, tối đa `max` sản phẩm.
 * Sản phẩm đã chọn từ trước giữ nguyên thứ tự; sản phẩm mới chọn thêm xếp cuối.
 */
export function VideoProductPicker({ selected, max, onApply, onClose }: {
  selected: SelectedProduct[];
  max: number;
  onApply: (products: SelectedProduct[]) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [ids, setIds] = useState<Set<string>>(new Set(selected.map((p) => p.id)));

  const products = useQuery({
    queryKey: ["admin-products-picker"],
    queryFn: () => api<{ content: ProductRow[] }>("/api/admin/products?page_size=200"),
  });

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (products.data?.content ?? []).filter((p) => !text || p.name.toLowerCase().includes(text));
  }, [products.data, q]);

  const toggle = (id: string) =>
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < max) next.add(id);
      return next;
    });

  function apply() {
    const byId = new Map((products.data?.content ?? []).map((p) => [p.id, p]));
    const kept = selected.filter((p) => ids.has(p.id)); // giữ thứ tự cũ
    const added = [...ids]
      .filter((id) => !selected.some((p) => p.id === id))
      .map((id) => byId.get(id))
      .filter((p): p is ProductRow => !!p)
      .map((p) => ({ id: p.id, name: p.name, imageUrl: p.images?.[0] ?? null, price: p.effectivePrice ?? p.price }));
    onApply([...kept, ...added]);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Chọn sản phẩm cho video"
         className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chọn sản phẩm giới thiệu trong video</h2>
            <p className="mt-0.5 text-sm text-slate-500">Khách xem video sẽ thấy các sản phẩm này và bấm để mua. Tối đa {max} sản phẩm.</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b p-4">
          <label className="relative block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm theo tên..."
                   className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-brand" />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {products.isPending ? (
            <p className="p-6 text-center text-sm text-slate-500">Đang tải sản phẩm...</p>
          ) : products.error ? (
            <p className="p-6 text-center text-sm text-destructive">{errorMessage(products.error)}</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Không tìm thấy sản phẩm nào.</p>
          ) : (
            <ul>
              {rows.map((p) => {
                const checked = ids.has(p.id);
                const full = !checked && ids.size >= max;
                return (
                  <li key={p.id}>
                    <label className={`flex items-center gap-3 rounded-xl p-2.5 ${full ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50"}`}>
                      <input type="checkbox" checked={checked} disabled={full} onChange={() => toggle(p.id)} className="size-4 accent-brand" />
                      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong danh sách admin */}
                      {p.images?.[0] ? <img src={p.images[0]} alt="" className="size-10 shrink-0 rounded-lg bg-slate-100 object-cover" /> : <span className="size-10 shrink-0 rounded-lg bg-slate-100" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{p.name}</span>
                        <span className="text-xs text-slate-500">{formatVnd(p.effectivePrice ?? p.price)}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-4">
          <span className="text-sm text-slate-600">Đã chọn <strong>{ids.size}</strong>/{max}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="button" onClick={apply}>Xong</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
