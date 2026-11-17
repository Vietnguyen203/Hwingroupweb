"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Check, Gift, Minus, Package, Plus, Search, Sparkles, Tag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse, PageResponse } from "@/lib/types";

type AdminProductItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  unit: string | null;
  categoryId: string;
};

export function AdminComboBuilder({
  isOpen,
  onClose,
  categories,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryResponse[];
  onSaved: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [comboName, setComboName] = useState("");
  const [customStock, setCustomStock] = useState("50");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách sản phẩm có sẵn
  const productsQuery = useQuery({
    queryKey: ["admin-products-combo-builder"],
    queryFn: () => api<PageResponse<AdminProductItem>>("/api/admin/products?page_size=100"),
    enabled: isOpen,
  });

  const allProducts = productsQuery.data?.content ?? [];

  // Lọc sản phẩm
  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchCat = selectedCatFilter ? p.categoryId === selectedCatFilter : true;
    return matchSearch && matchCat;
  });

  // Tìm danh mục Combo
  const comboCategory = useMemo(() => {
    return (
      categories.find((c) => c.slug.includes("combo") || c.name.toLowerCase().includes("combo")) ??
      categories[0]
    );
  }, [categories]);

  // Danh sách các sản phẩm đang được chọn
  const selectedProducts = useMemo(() => {
    return allProducts
      .filter((p) => (selectedQuantities[p.id] ?? 0) > 0)
      .map((p) => ({
        product: p,
        quantity: selectedQuantities[p.id],
        subtotal: p.price * selectedQuantities[p.id],
      }));
  }, [allProducts, selectedQuantities]);

  // Tính toán giá trị: Giá gốc & Giá Combo -10%
  const originalTotal = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedProducts]);

  // Giảm giá 10%
  const discountAmount = useMemo(() => {
    return Math.round((originalTotal * 0.1) / 1000) * 1000;
  }, [originalTotal]);

  const comboPrice = useMemo(() => {
    return Math.max(0, originalTotal - discountAmount);
  }, [originalTotal, discountAmount]);

  const totalItemsCount = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedProducts]);

  // Tự động gợi ý tên combo khi thêm/bớt sản phẩm
  const suggestedName = useMemo(() => {
    if (selectedProducts.length === 0) return "";
    const names = selectedProducts.map((sp) => sp.product.name.replace(/\s*\d+g\s*$/i, "")).slice(0, 3);
    return `Combo ${totalItemsCount} món: ${names.join(" + ")}`;
  }, [selectedProducts, totalItemsCount]);

  const effectiveName = comboName || suggestedName;

  function toggleProduct(productId: string) {
    setSelectedQuantities((prev) => {
      const current = prev[productId] ?? 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: 1 };
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setSelectedQuantities((prev) => {
      const current = prev[productId] ?? 0;
      const nextVal = current + delta;
      if (nextVal <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: nextVal };
    });
  }

  async function handleCreateCombo(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError("Vui lòng chọn ít nhất 1 sản phẩm để tạo gói combo!");
      return;
    }
    if (!comboCategory) {
      setError("Chưa tìm thấy danh mục để gán combo!");
      return;
    }

    setBusy(true);
    setError(null);

    const itemsSummary = selectedProducts
      .map((sp) => `${sp.product.name} (x${sp.quantity})`)
      .join(", ");

    const shortDesc = `Combo ${totalItemsCount} món gồm: ${itemsSummary}. Ưu đãi tiết kiệm 10% (giảm ${formatVnd(discountAmount)}).`;

    // Thu thập ảnh từ các sản phẩm thành phần (tối đa 6 ảnh)
    const comboImages: string[] = [];
    selectedProducts.forEach((sp) => {
      if (sp.product.images?.[0] && !comboImages.includes(sp.product.images[0])) {
        comboImages.push(sp.product.images[0]);
      }
    });

    const body = {
      categoryId: comboCategory.id,
      name: effectiveName.trim(),
      slug: null, // để backend tự động sinh slug từ tên
      price: comboPrice,
      compareAtPrice: originalTotal,
      unit: `combo ${totalItemsCount} món`,
      shortDescription: shortDesc,
      description: `Gói Combo tiết kiệm 10% đặc biệt của Hwin Group.\n\nBao gồm:\n${selectedProducts.map((sp) => `- ${sp.product.name}: Số lượng ${sp.quantity} ${sp.product.unit || "phần"}`).join("\n")}\n\nTổng giá trị gốc: ${formatVnd(originalTotal)}\nGiá ưu đãi Combo (-10%): ${formatVnd(comboPrice)}\nTiết kiệm ngay: ${formatVnd(discountAmount)} khi mua theo combo.`,
      initialStock: Number(customStock || 50),
      bestseller: true,
      images: comboImages,
      foodInfo: {
        manufacturer: "Công ty TNHH Thực phẩm HWIN",
        shelfLife: "Theo từng sản phẩm trong combo",
        storageInstructions: "Bảo quản lạnh hoặc theo hướng dẫn từng món",
        declarationNumber: "",
        foodSafetyCertNumber: "ATTP-2025-0001-HWIN",
        foodSafetyCertUrl: "/sample/cert-attp.svg",
      },
    };

    try {
      await api("/api/admin/products", { method: "POST", body });
      showToast({
        type: "success",
        title: "Tạo Combo thành công!",
        message: `Đã tạo "${effectiveName}" với ưu đãi -10% (Giá: ${formatVnd(comboPrice)})`,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Main Dialog Modal */}
      <div className="relative z-10 flex h-[92vh] max-h-[880px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/20">
              <Gift className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Tạo Combo từ sản phẩm có sẵn</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                  <Sparkles className="size-3" /> Giảm 10% tự động
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chọn các món thành phần, hệ thống tự động cộng dồn giá trị và trừ -10% làm giá bán combo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body content: 2 cột (Trái: Chọn sản phẩm - Phải: Xem trước & Tính toán) */}
        <form onSubmit={handleCreateCombo} className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Cột trái: Bộ lọc & Danh sách sản phẩm để tick chọn */}
          <div className="flex flex-1 flex-col border-r border-slate-100 bg-slate-50/50 p-5 overflow-hidden">
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Chọn sản phẩm thành phần
                </span>
                <span className="text-xs font-semibold text-brand">
                  Đã chọn: {selectedProducts.length} sản phẩm
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9 text-xs bg-white"
                  />
                </div>
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="">Mọi danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Danh sách cuộn các sản phẩm */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {productsQuery.isPending ? (
                <div className="py-12 text-center text-xs text-slate-400">Đang tải sản phẩm...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp</div>
              ) : (
                filteredProducts.map((p) => {
                  const qty = selectedQuantities[p.id] ?? 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition-all ${
                        isSelected
                          ? "border-rose-300 bg-rose-50/70 shadow-xs ring-1 ring-rose-200"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-lg border transition ${
                            isSelected
                              ? "border-rose-600 bg-rose-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        {/* Product Image */}
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] text-slate-400">
                              No img
                            </div>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-slate-800">{p.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-rose-600">{formatVnd(p.price)}</span>
                            {p.unit && <span>• {p.unit}</span>}
                            <span>• Kho: {p.stock}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity stepper (hiển thị khi được chọn) */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2 py-1 shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={() => changeQuantity(p.id, -1)}
                            className="flex size-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(p.id, 1)}
                            className="flex size-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cột phải: Xem trước bảng giá tính toán & Điền tên Combo */}
          <div className="flex w-full md:w-[380px] shrink-0 flex-col bg-white p-6 overflow-y-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Bảng tính giá & Thông tin Combo
            </span>

            {/* Thẻ bảng tính toán tiền */}
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/60 to-white p-4 shadow-xs space-y-3">
              <div className="text-xs font-semibold text-slate-700">Chi tiết thành phần:</div>

              {selectedProducts.length === 0 ? (
                <div className="py-4 text-center text-xs italic text-slate-400">
                  (Chưa chọn món nào ở cột bên trái)
                </div>
              ) : (
                <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {selectedProducts.map(({ product, quantity, subtotal }) => (
                    <div key={product.id} className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2 text-slate-600">
                        {product.name} <strong className="text-slate-800">×{quantity}</strong>
                      </span>
                      <span className="font-medium text-slate-700 whitespace-nowrap">
                        {formatVnd(subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-rose-200/80 pt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng giá trị gốc:</span>
                  <span className="line-through font-medium text-slate-500">
                    {formatVnd(originalTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="size-3" /> Ưu đãi Combo (-10%):
                  </span>
                  <span>- {formatVnd(discountAmount)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-rose-200/80 pt-2">
                  <span className="font-bold text-slate-800">Giá bán gói Combo:</span>
                  <div className="text-right">
                    <div className="text-lg font-black text-rose-600">{formatVnd(comboPrice)}</div>
                    <div className="text-[10px] font-semibold text-emerald-600">
                      Tiết kiệm 10%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhập tên Combo */}
            <div className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">Tên gói Combo *</span>
                <Input
                  required
                  placeholder={suggestedName || "VD: Combo Tết Sum Vầy"}
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="h-10 text-xs font-medium"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Tồn kho ban đầu</span>
                  <Input
                    type="number"
                    min={1}
                    value={customStock}
                    onChange={(e) => setCustomStock(e.target.value)}
                    className="h-9 text-xs"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Danh mục gán</span>
                  <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 truncate">
                    {comboCategory?.name ?? "Combo"}
                  </div>
                </label>
              </div>
            </div>

            {error && <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}

            {/* Nút hành động */}
            <div className="mt-auto pt-5 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={busy}
                className="h-11 flex-1 font-semibold text-slate-600 border-slate-200"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={busy || selectedProducts.length === 0}
                className="h-11 flex-[2] bg-gradient-to-r from-rose-600 to-amber-600 font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-amber-700"
              >
                {busy ? "Đang tạo Combo..." : `Tạo Combo (${formatVnd(comboPrice)})`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
