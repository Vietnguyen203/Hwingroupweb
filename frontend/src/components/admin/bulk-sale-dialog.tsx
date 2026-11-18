"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { MAX_SALE_PERCENT } from "./product-sale-dialog";

const PRESETS = [5, 10, 15, 20, 30];

/**
 * Đặt một mức giảm giá thêm (%, còn gọi là voucher giảm giá) cho nhiều sản phẩm đã chọn cùng lúc.
 * Gọi API đặt giảm giá có sẵn (PATCH /api/admin/products/{id}/sale) cho từng sản phẩm; sản phẩm nào lỗi thì báo riêng.
 * 0 = bỏ giảm giá của các sản phẩm đã chọn.
 */
export function BulkSaleDialog({ products, onClose, onSaved }: {
  products: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("10");
  const percent = Number(value);
  const valid = value !== "" && Number.isInteger(percent) && percent >= 0 && percent <= MAX_SALE_PERCENT;

  const save = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        products.map((p) => api(`/api/admin/products/${p.id}/sale`, { method: "PATCH", body: { salePercent: percent } })),
      );
      return { ok: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length };
    },
    onSuccess: ({ ok, failed }) => {
      showToast({
        type: failed ? "error" : "success",
        title: failed ? "Áp dụng chưa hoàn tất" : "Đã áp dụng",
        message: failed
          ? `Đã áp dụng cho ${ok} sản phẩm, ${failed} sản phẩm bị lỗi.`
          : percent > 0 ? `Đã giảm thêm ${percent}% cho ${ok} sản phẩm.` : `Đã bỏ giảm giá của ${ok} sản phẩm.`,
      });
      onSaved();
      onClose();
    },
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Thêm voucher giảm giá"
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm voucher giảm giá</h2>
            <p className="mt-0.5 text-sm text-slate-500">Áp dụng cho {products.length} sản phẩm đã chọn</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {products.map((p) => <li key={p.id} className="truncate">• {p.name}</li>)}
        </ul>

        <form onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Phần trăm giảm thêm (0 = bỏ giảm giá, tối đa {MAX_SALE_PERCENT}%)</span>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_SALE_PERCENT}
                step={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-11 w-28 rounded-xl border border-slate-200 px-3 text-lg font-semibold outline-none focus:border-brand"
              />
              <span className="text-lg font-semibold text-slate-700">%</span>
            </div>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((n) => (
              <button key={n} type="button" onClick={() => setValue(String(n))}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand">
                {n}%
              </button>
            ))}
            <button type="button" onClick={() => setValue("0")}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-600">
              Bỏ giảm giá
            </button>
          </div>

          {!valid && value !== "" && <p className="text-sm text-destructive">Nhập số nguyên từ 0 đến {MAX_SALE_PERCENT}.</p>}
          {save.error && <p role="alert" className="text-sm text-destructive">Có lỗi xảy ra, vui lòng thử lại.</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={!valid || save.isPending}>
              {save.isPending ? "Đang áp dụng..." : `Áp dụng cho ${products.length} sản phẩm`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
