"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";

export const MAX_SALE_PERCENT = 90;
const PRESETS = [5, 10, 15, 20, 30];

/** Giá khách trả sau giảm thêm – cùng công thức backend: làm tròn xuống đồng, tối thiểu 1đ. */
export function priceAfterSale(price: number, percent: number): number {
  return Math.max(Math.floor((price * (100 - percent)) / 100), 1);
}

/**
 * Đặt giảm giá thêm (%) cho sản phẩm hoặc combo. Chỉ ADMIN (API /api/admin/** chặn theo vai trò).
 * Tính trên giá niêm yết: combo 1.000.000đ (đã trừ 10%) giảm thêm 15% -> khách trả 850.000đ.
 */
export function ProductSaleDialog({ product, onClose, onSaved }: {
  product: { id: string; name: string; price: number; salePercent: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(String(product.salePercent));
  const percent = Number(value);
  const valid = value !== "" && Number.isInteger(percent) && percent >= 0 && percent <= MAX_SALE_PERCENT;

  const save = useMutation({
    mutationFn: () => api(`/api/admin/products/${product.id}/sale`, { method: "PATCH", body: { salePercent: percent } }),
    onSuccess: () => {
      showToast({
        type: "success",
        message: percent > 0 ? `Đã giảm thêm ${percent}% cho "${product.name}".` : `Đã bỏ giảm giá của "${product.name}".`,
      });
      onSaved();
      onClose();
    },
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Giảm giá sản phẩm"
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Giảm giá thêm</h2>
            <p className="mt-0.5 text-sm text-slate-500">{product.name}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

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

          <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
            <p className="flex justify-between"><span className="text-slate-500">Giá niêm yết</span><span className="font-medium">{formatVnd(product.price)}</span></p>
            <p className="flex justify-between">
              <span className="text-slate-500">Khách trả{valid && percent > 0 ? ` (giảm thêm ${percent}%)` : ""}</span>
              <span className="text-base font-bold text-brand-red">{valid ? formatVnd(priceAfterSale(product.price, percent)) : "—"}</span>
            </p>
          </div>

          {!valid && value !== "" && <p className="text-sm text-destructive">Nhập số nguyên từ 0 đến {MAX_SALE_PERCENT}.</p>}
          {save.error && <p role="alert" className="text-sm text-destructive">{errorMessage(save.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={!valid || save.isPending || percent === product.salePercent}>
              {save.isPending ? "Đang lưu..." : "Lưu giảm giá"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
