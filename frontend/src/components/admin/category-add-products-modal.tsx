"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse } from "@/lib/types";

type ProductRow = { id: string; name: string; price: number; categoryId: string | null; images: string[] };

/**
 * Thêm các sản phẩm ĐÃ CÓ vào một danh mục (không tạo sản phẩm mới).
 * Mỗi sản phẩm chỉ thuộc 1 danh mục, nên chọn sản phẩm đang ở danh mục khác sẽ chuyển nó sang danh mục này.
 */
export function CategoryAddProductsModal({ category, categories, onClose }: {
  category: CategoryResponse;
  categories: CategoryResponse[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const products = useQuery({
    queryKey: ["admin-products-picker"],
    queryFn: () => api<{ content: ProductRow[] }>("/api/admin/products?page_size=200"),
  });

  const categoryName = (id: string | null) => (id ? categories.find((c) => c.id === id)?.name ?? "Danh mục khác" : "Chưa phân loại");

  // Chỉ hiện sản phẩm chưa thuộc danh mục này
  const candidates = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (products.data?.content ?? [])
      .filter((p) => p.categoryId !== category.id)
      .filter((p) => !text || p.name.toLowerCase().includes(text));
  }, [products.data, category.id, q]);

  const moving = useMemo(
    () => (products.data?.content ?? []).filter((p) => selected.has(p.id) && p.categoryId).length,
    [products.data, selected],
  );

  const add = useMutation({
    mutationFn: async () => {
      const ids = [...selected];
      const results = await Promise.allSettled(
        ids.map((id) => api(`/api/admin/products/${id}/category`, { method: "PATCH", body: { categoryId: category.id } })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { ok: ids.length - failed, failed };
    },
    onSuccess: ({ ok, failed }) => {
      qc.invalidateQueries({ queryKey: ["admin-products-summary"] });
      qc.invalidateQueries({ queryKey: ["admin-products-picker"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      if (failed) {
        showToast({ type: "error", title: "Một số sản phẩm chưa thêm được", message: `Đã thêm ${ok}, lỗi ${failed} sản phẩm.` });
      } else {
        showToast({ type: "success", message: `Đã thêm ${ok} sản phẩm vào danh mục "${category.name}".` });
        onClose();
      }
    },
    onError: (err) => showToast({ type: "error", title: "Lỗi", message: errorMessage(err) }),
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div role="dialog" aria-modal="true" aria-label="Thêm sản phẩm vào danh mục"
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm sản phẩm vào &ldquo;{category.name}&rdquo;</h2>
            <p className="mt-0.5 text-sm text-slate-500">Chọn các sản phẩm đã có để đưa vào danh mục này.</p>
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
            <p className="p-6 text-center text-sm text-slate-500">Đang tải...</p>
          ) : products.error ? (
            <p className="p-6 text-center text-sm text-destructive">{errorMessage(products.error)}</p>
          ) : candidates.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Không có sản phẩm nào để thêm.</p>
          ) : (
            <ul>
              {candidates.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-4" />
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong danh sách admin */}
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="size-10 shrink-0 rounded-lg bg-slate-100 object-cover" /> : <span className="size-10 shrink-0 rounded-lg bg-slate-100" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-500">{formatVnd(p.price)} · Hiện ở: {categoryName(p.categoryId)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t p-4">
          {moving > 0 && (
            <p className="text-xs text-amber-700">{moving} sản phẩm đang thuộc danh mục khác và sẽ được chuyển sang danh mục này.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="button" disabled={selected.size === 0 || add.isPending} onClick={() => add.mutate()}>
              {add.isPending ? "Đang thêm..." : selected.size > 0 ? `Thêm ${selected.size} sản phẩm` : "Thêm sản phẩm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
