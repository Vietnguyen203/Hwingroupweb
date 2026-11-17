"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Gift, Layers, Plus, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { showToast } from "@/components/ui/toast";
import { useAdminList } from "@/hooks/use-admin-list";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse } from "@/lib/types";
import { CategoryForm, CategoryFormModal, EMPTY_CATEGORY_FORM } from "./admin-categories";
import { AdminComboBuilder } from "./admin-combo-builder";
import { ProductSaleDialog } from "./product-sale-dialog";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type FoodInfo = {
  manufacturer: string;
  shelfLife: string;
  storageInstructions: string;
  declarationNumber: string;
  foodSafetyCertNumber: string;
  foodSafetyCertUrl: string;
};

type AdminProductResponse = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  price: number;
  salePercent: number;
  effectivePrice: number;
  compareAtPrice: number | null;
  shortDescription: string | null;
  description: string | null;
  unit: string | null;
  brand: string | null;
  weight: string | null;
  packaging: string | null;
  origin: string | null;
  ingredients: string | null;
  features: string | null;
  usageInstructions: string | null;
  stock: number;
  active: boolean;
  bestseller: boolean;
  soldCount: number;
  images: string[];
  foodInfo: Partial<FoodInfo> | null;
};

type Form = {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string;
  unit: string;
  brand: string;
  weight: string;
  packaging: string;
  origin: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  features: string;
  usageInstructions: string;
  initialStock: string;
  bestseller: boolean;
  images: string;
  foodInfo: FoodInfo;
};

/** Mỗi sản phẩm có tối thiểu 1 và tối đa 5 ảnh. */
const MIN_IMAGES = 1;
const MAX_IMAGES = 5;

const EMPTY_FOOD: FoodInfo = {
  manufacturer: "",
  shelfLife: "",
  storageInstructions: "",
  declarationNumber: "",
  foodSafetyCertNumber: "",
  foodSafetyCertUrl: "",
};

const EMPTY: Form = {
  categoryId: "",
  name: "",
  slug: "",
  price: "",
  compareAtPrice: "",
  unit: "",
  brand: "",
  weight: "",
  packaging: "",
  origin: "Việt Nam",
  shortDescription: "",
  description: "",
  ingredients: "",
  features: "",
  usageInstructions: "",
  initialStock: "0",
  bestseller: false,
  images: "",
  foodInfo: EMPTY_FOOD,
};

/** Quản lý sản phẩm: tìm / lọc danh mục, thêm / sửa, điều chỉnh tồn kho, ẩn / hiện, gán danh mục trực tiếp. */
export function AdminProducts() {
  const qc = useQueryClient();
  const [salePicking, setSalePicking] = useState<AdminProductResponse | null>(null);
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api<CategoryResponse[]>("/api/admin/categories"),
  });
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminProductResponse>("/api/admin/products");
  const [form, setForm] = useState<Form | null>(null);
  const [categoryModalForm, setCategoryModalForm] = useState<CategoryForm | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProductResponse | null>(null);
  const [showComboBuilder, setShowComboBuilder] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/products"] });
  const patch = useMutation({
    mutationFn: ({ id, path, body }: { id: string; path: string; body: unknown }) =>
      api(`/api/admin/products/${id}/${path}`, { method: "PATCH", body }),
    onSuccess: refresh,
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      if (deletingProduct) {
        showToast({
          type: "success",
          title: "Đã xóa",
          message: `Đã xóa sản phẩm "${deletingProduct.name}" thành công!`,
        });
      }
      setDeletingProduct(null);
    },
    onError: (err) => {
      showToast({
        type: "error",
        title: "Không thể xóa",
        message: errorMessage(err),
      });
    },
  });

  const cats = categories.data ?? [];
  const addCat = useQueryParam("addCat");

  useEffect(() => {
    if (addCat && cats.some((c) => c.id === addCat)) {
      setForm({ ...EMPTY, categoryId: addCat });
    }
  }, [addCat, cats]);

  function edit(p: AdminProductResponse) {
    setForm({
      id: p.id,
      categoryId: p.categoryId ?? "",
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      unit: p.unit ?? "",
      brand: p.brand ?? "",
      weight: p.weight ?? "",
      packaging: p.packaging ?? "",
      origin: p.origin ?? "",
      shortDescription: p.shortDescription ?? "",
      description: p.description ?? "",
      ingredients: p.ingredients ?? "",
      features: p.features ?? "",
      usageInstructions: p.usageInstructions ?? "",
      initialStock: "0",
      bestseller: p.bestseller,
      images: p.images.join("\n"),
      foodInfo: { ...EMPTY_FOOD, ...Object.fromEntries(Object.entries(p.foodInfo ?? {}).map(([k, v]) => [k, v ?? ""])) },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPage
      title="Sản phẩm"
      actions={
        !form && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                setCategoryModalForm({
                  ...EMPTY_CATEGORY_FORM,
                  sortOrder: cats.length + 1,
                })
              }
              className="gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <FolderPlus className="size-4 text-brand" /> + Thêm danh mục
            </Button>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Layers className="size-3.5" /> Quản lý danh mục ↗
            </Link>
            <Button
              type="button"
              onClick={() => setShowComboBuilder(true)}
              className="gap-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-amber-600"
            >
              <Gift className="size-4" /> + Tạo Combo từ SP (-10%)
            </Button>
            <Button
              onClick={() => setForm({ ...EMPTY, categoryId: cats[0]?.id ?? "" })}
              className="gap-2 shadow-sm shadow-brand/20"
            >
              <Plus className="size-4" /> Thêm sản phẩm
            </Button>
          </div>
        )
      }
    >
      {/* Modal tạo danh mục nhanh ngay trên trang sản phẩm */}
      {categoryModalForm && (
        <div className="mb-6">
          <CategoryFormModal
            form={categoryModalForm}
            setForm={setCategoryModalForm}
            onSaved={(savedCat) => {
              setCategoryModalForm(null);
              qc.invalidateQueries({ queryKey: ["admin-categories"] });
              if (form && savedCat) {
                setForm({ ...form, categoryId: savedCat.id });
              }
              showToast({
                type: "success",
                title: "Thành công",
                message: `Đã tạo danh mục "${savedCat?.name}"!`,
              });
            }}
          />
        </div>
      )}

      {form && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={cats}
          onOpenCreateCategory={() =>
            setCategoryModalForm({
              ...EMPTY_CATEGORY_FORM,
              sortOrder: cats.length + 1,
            })
          }
          onOpenComboBuilder={() => {
            setForm(null);
            setShowComboBuilder(true);
          }}
          onDelete={() => {
            const prod = query.data?.content.find((p) => p.id === form.id);
            if (prod) {
              setDeletingProduct(prod);
              setForm(null);
            }
          }}
          onSaved={() => {
            setForm(null);
            refresh();
          }}
        />
      )}

      <FilterBar>
        <Input
          placeholder="Tìm sản phẩm theo tên..."
          defaultValue={filters.q ?? ""}
          className="h-10 w-64"
          onKeyDown={(e) => {
            if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim());
          }}
        />
        <Select
          value={filters.category ?? ""}
          onChange={(v) => setFilter("category", v)}
          options={[["", "Mọi danh mục"], ...cats.map((c) => [c.slug, c.name] as [string, string])]}
        />
        <div className="ml-auto text-xs font-medium text-slate-500">
          Tổng danh mục: <strong className="text-slate-800">{cats.length}</strong>
        </div>
      </FilterBar>

      {patch.error && <p className="text-sm text-destructive">{errorMessage(patch.error)}</p>}

      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <p className="text-sm text-destructive">{errorMessage(query.error)}</p>
      ) : (
        <>
          <Table head={["Sản phẩm", "Danh mục", "Giá", "Tồn kho", "Đã bán", "Trạng thái", "Thao tác"]}>
            {query.data.content.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="size-11 rounded-lg border object-cover shadow-2xs" />
                    ) : (
                      <div className="size-11 rounded-lg bg-slate-100 border flex items-center justify-center text-xs text-slate-400">
                        No img
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-800">
                        {p.name}
                        {p.bestseller && <span className="ml-1.5 text-xs text-amber-500 font-bold">★ Bán chạy</span>}
                      </span>
                      {p.unit && <div className="text-[11px] text-slate-400">{p.unit}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {/* Dropdown gán danh mục trực tiếp cho sản phẩm */}
                  <select
                    value={p.categoryId || ""}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const catObj = cats.find((c) => c.id === newCatId);
                      patch.mutate(
                        {
                          id: p.id,
                          path: "category",
                          body: { categoryId: newCatId || null },
                        },
                        {
                          onSuccess: () => {
                            showToast({
                              type: "success",
                              message: catObj
                                ? `Đã chuyển "${p.name}" vào danh mục "${catObj.name}"!`
                                : `Đã hủy gán danh mục cho "${p.name}"!`,
                            });
                          },
                        }
                      );
                    }}
                    className={`h-8 max-w-[170px] truncate rounded-lg border px-2 text-xs font-medium shadow-2xs transition outline-none ${
                      p.categoryId
                        ? "border-slate-200 bg-white text-slate-800 focus:border-brand"
                        : "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                    }`}
                  >
                    <option value="">-- Chưa gán danh mục --</option>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {p.salePercent > 0 ? (
                    <>
                      <span className="block">{formatVnd(p.effectivePrice)}</span>
                      <span className="text-xs font-normal text-slate-400 line-through">{formatVnd(p.price)}</span>
                      <span className="ml-1.5 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-600">-{p.salePercent}%</span>
                    </>
                  ) : (
                    formatVnd(p.price)
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{p.stock}</td>
                <td className="px-4 py-3 text-slate-600">{p.soldCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${p.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {p.active ? "Đang bán" : "Đã ẩn"}
                  </span>
                </td>
                <td className="space-x-1.5 px-4 py-3 whitespace-nowrap">
                  <ActionButton onClick={() => edit(p)}>Sửa</ActionButton>
                  <ActionButton onClick={() => setSalePicking(p)} title="Đặt % giảm giá thêm (cả combo)">Giảm giá</ActionButton>
                  <ActionButton
                    onClick={() => {
                      const v = window.prompt("Điều chỉnh tồn kho (+ nhập thêm, - xuất bớt)", "10");
                      if (v && Number(v)) patch.mutate({ id: p.id, path: "stock", body: { delta: Number(v) } });
                    }}
                  >
                    Kho
                  </ActionButton>
                  <ActionButton
                    tone={p.active ? "danger" : "default"}
                    onClick={() => patch.mutate({ id: p.id, path: "active", body: { active: !p.active } })}
                  >
                    {p.active ? "Ẩn" : "Hiện"}
                  </ActionButton>
                  <ActionButton
                    tone="danger"
                    title="Xóa vĩnh viễn sản phẩm"
                    onClick={() => setDeletingProduct(p)}
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 className="size-3.5 text-rose-500" />
                  </ActionButton>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
          {salePicking && <ProductSaleDialog product={salePicking} onClose={() => setSalePicking(null)} onSaved={refresh} />}
        </>
      )}

      {/* Hộp thoại xác nhận xóa sản phẩm */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        title="Xác nhận xóa sản phẩm"
        message={
          <div>
            Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm{" "}
            <strong className="font-bold text-slate-900">&ldquo;{deletingProduct?.name}&rdquo;</strong> không?
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Sản phẩm sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống bán hàng và cơ sở dữ liệu.
            </p>
          </div>
        }
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        tone="danger"
        loading={deleteProduct.isPending}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            deleteProduct.mutate(deletingProduct.id);
          }
        }}
      />

      {/* Modal tạo gói Combo từ các sản phẩm thành phần (-10%) */}
      <AdminComboBuilder
        isOpen={showComboBuilder}
        onClose={() => setShowComboBuilder(false)}
        categories={cats}
        onSaved={() => {
          refresh();
        }}
      />
    </AdminPage>
  );
}

function ProductForm({
  form,
  setForm,
  categories,
  onOpenCreateCategory,
  onOpenComboBuilder,
  onDelete,
  onSaved,
}: {
  form: Form;
  setForm: (f: Form | null) => void;
  categories: CategoryResponse[];
  onOpenCreateCategory: () => void;
  onOpenComboBuilder?: () => void;
  onDelete?: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setForm({ ...form, [k]: v });
  const setFood = (k: keyof FoodInfo, v: string) => setForm({ ...form, foodInfo: { ...form.foodInfo, [k]: v } });

  const imageList = form.images.split("\n").map((x) => x.trim()).filter(Boolean);

  async function upload(file: File) {
    if (imageList.length >= MAX_IMAGES) {
      throw new Error(`Tối đa ${MAX_IMAGES} ảnh mỗi sản phẩm`);
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.messageCode, body.message ?? "Tải ảnh thất bại");
    setForm({ ...form, images: [form.images.trim(), body.url].filter(Boolean).join("\n") });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) {
      setError("Vui lòng chọn hoặc tạo danh mục cho sản phẩm!");
      return;
    }
    if (imageList.length < MIN_IMAGES || imageList.length > MAX_IMAGES) {
      setError(`Sản phẩm cần từ ${MIN_IMAGES} đến ${MAX_IMAGES} ảnh (hiện có ${imageList.length})`);
      return;
    }
    setBusy(true);
    setError(null);
    const empty = (s: string) => (s.trim() ? s.trim() : null);
    const body = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      slug: empty(form.slug),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      unit: empty(form.unit),
      brand: form.brand.trim(),
      weight: form.weight.trim(),
      packaging: form.packaging.trim(),
      origin: form.origin.trim(),
      shortDescription: empty(form.shortDescription),
      description: empty(form.description),
      ingredients: empty(form.ingredients),
      features: empty(form.features),
      usageInstructions: empty(form.usageInstructions),
      initialStock: Number(form.initialStock || 0),
      bestseller: form.bestseller,
      images: imageList,
      foodInfo: Object.fromEntries(Object.entries(form.foodInfo).map(([k, v]) => [k, empty(v)])),
    };
    try {
      await api(form.id ? `/api/admin/products/${form.id}` : "/api/admin/products", {
        method: form.id ? "PUT" : "POST",
        body,
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const input = (k: keyof Form, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <Input value={form[k] as string} onChange={(e) => set(k, e.target.value)} className="h-10" {...props} />
    </label>
  );

  const food = (k: keyof FoodInfo, label: string) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <Input value={form.foodInfo[k]} onChange={(e) => setFood(k, e.target.value)} className="h-10" />
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800">{form.id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
        <button
          type="button"
          onClick={() => setForm(null)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          Đóng ✕
        </button>
      </div>

      {/* Banner gợi ý tạo Combo nhanh khi thêm mới */}
      {!form.id && onOpenComboBuilder && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xs">
              <Gift className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Bạn muốn tạo gói Combo ưu đãi từ các món có sẵn?
              </div>
              <div className="text-[11px] text-slate-500">
                Chọn các món thành phần, hệ thống sẽ tự động tổng hợp thông tin và áp dụng chiết khấu giảm 10%!
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onOpenComboBuilder}
            className="gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-xs font-bold text-white shadow-xs hover:from-rose-700 hover:to-amber-700"
          >
            <Sparkles className="size-3.5" /> Mở bộ tạo Combo (-10%)
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {input("name", "Tên sản phẩm *", { required: true, maxLength: 255 })}

        {/* Khối chọn danh mục kèm nút tạo danh mục nhanh */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Danh mục sản phẩm *</span>
            <button
              type="button"
              onClick={onOpenCreateCategory}
              className="text-[11px] font-bold text-brand-link hover:underline"
            >
              + Tạo danh mục mới
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              <span>Chưa có danh mục.</span>
              <button
                type="button"
                onClick={onOpenCreateCategory}
                className="font-bold underline text-amber-900"
              >
                + Bấm tạo ngay
              </button>
            </div>
          ) : (
            <Select
              value={form.categoryId}
              onChange={(v) => set("categoryId", v)}
              className="w-full"
              options={categories.map((c) => [c.id, c.name])}
            />
          )}
        </div>

        {input("slug", "Slug (để trống = tự sinh)", { maxLength: 255 })}
        {input("price", "Giá bán (đ) *", { required: true, type: "number", min: 1 })}
        {input("compareAtPrice", "Giá gốc gạch ngang (đ, không bắt buộc)", { type: "number", min: 1 })}
        {input("unit", "Đơn vị tính", { maxLength: 50, placeholder: "VD: đòn, hộp, gói" })}
        {input("brand", "Thương hiệu *", { required: true, maxLength: 100, placeholder: "VD: HWIN Food" })}
        {input("weight", "Khối lượng *", { required: true, maxLength: 50, placeholder: "VD: 500g, 20 cái" })}
        {input("packaging", "Đóng gói *", { required: true, maxLength: 100, placeholder: "VD: Gói hút chân không" })}
        {input("origin", "Xuất xứ *", { required: true, maxLength: 100, placeholder: "VD: Việt Nam" })}
        {!form.id && input("initialStock", "Tồn kho ban đầu", { type: "number", min: 0 })}
        {input("shortDescription", "Mô tả ngắn", { maxLength: 500 })}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-700">Mô tả chi tiết</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-xl border border-input p-3 text-sm outline-none focus-visible:border-ring"
        />
      </label>

      {(
        [
          ["ingredients", "Thành phần"],
          ["features", "Đặc điểm"],
          ["usageInstructions", "Hướng dẫn sử dụng (bảo quản nhập ở mục Thông tin thực phẩm)"],
        ] as const
      ).map(([k, label]) => (
        <label key={k} className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <textarea
            rows={2}
            maxLength={5000}
            value={form[k]}
            onChange={(e) => set(k, e.target.value)}
            className="w-full rounded-xl border border-input p-3 text-sm outline-none focus-visible:border-ring"
          />
        </label>
      ))}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-700">
          Ảnh * (mỗi dòng một URL, ảnh đầu là ảnh chính) –{" "}
          <b className={imageList.length < MIN_IMAGES || imageList.length > MAX_IMAGES ? "text-destructive" : "text-green-700"}>
            {imageList.length}/{MAX_IMAGES} ảnh (tối thiểu {MIN_IMAGES})
          </b>
        </span>
        <textarea
          rows={3}
          value={form.images}
          onChange={(e) => set("images", e.target.value)}
          className="w-full rounded-xl border border-input p-3 font-mono text-xs outline-none focus-visible:border-ring"
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-xs mt-1"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f).catch((err) => setError(errorMessage(err)));
            e.target.value = "";
          }}
        />
      </label>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">Thông tin thực phẩm (ATTP, HSD, bảo quản)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {food("manufacturer", "Nhà sản xuất")}
          {food("shelfLife", "Hạn sử dụng")}
          {food("storageInstructions", "Hướng dẫn bảo quản")}
          {food("declarationNumber", "Số tự công bố")}
          {food("foodSafetyCertNumber", "Số giấy chứng nhận ATTP")}
          {food("foodSafetyCertUrl", "Link giấy chứng nhận ATTP")}
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
        <input
          type="checkbox"
          checked={form.bestseller}
          onChange={(e) => set("bestseller", e.target.checked)}
          className="size-4 rounded text-brand focus:ring-brand/20"
        />
        <span>Gắn nhãn sản phẩm bán chạy (Bestseller)</span>
      </label>

      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-2.5">
          <Button type="submit" disabled={busy} className="shadow-sm shadow-brand/20">
            {busy ? "Đang lưu..." : "Lưu sản phẩm"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setForm(null)}>
            Hủy
          </Button>
        </div>
        {form.id && onDelete && (
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Trash2 className="size-4 mr-1.5" /> Xóa sản phẩm này
          </Button>
        )}
      </div>
    </form>
  );
}
