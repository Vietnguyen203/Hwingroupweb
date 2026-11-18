"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Eye, EyeOff, FolderPlus, Gift, Layers, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { showToast } from "@/components/ui/toast";
import { useAdminList } from "@/hooks/use-admin-list";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse } from "@/lib/types";
import { CategoryForm, CategoryFormModal, EMPTY_CATEGORY_FORM } from "./admin-categories";
import { AdminComboBuilder } from "./admin-combo-builder";
import { ImageUploader } from "@/components/ui/image-uploader";
import { BulkSaleDialog } from "./bulk-sale-dialog";
import { ProductSaleDialog } from "./product-sale-dialog";
import { AdminPage, FilterBar, IconButton, Loading, Select, Table } from "./admin-ui";

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

/**
 * Quản lý sản phẩm: tìm / lọc danh mục, thêm / sửa, giảm giá, ẩn / hiện, xóa. Cột thao tác dùng biểu tượng cho gọn;
 * tích ô vuông để chọn nhiều sản phẩm rồi xem / sửa (chọn 1), thêm voucher giảm giá hoặc xóa hàng loạt.
 * (Điều chỉnh tồn kho tạm ẩn: xem đoạn comment "TẠM ẨN" ở cột thao tác.)
 */
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
  const router = useRouter();
  const [bulkSaleOpen, setBulkSaleOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Sản phẩm đang được tích chọn; đổi trang / từ khóa / danh mục thì danh sách chọn tự về rỗng (không giữ id của trang khác)
  const scopeKey = `${page}|${filters.q ?? ""}|${filters.category ?? ""}`;
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: scopeKey, ids: [] });
  const selectedIds = selection.scope === scopeKey ? selection.ids : [];
  const setSelectedIds = (ids: string[]) => setSelection({ scope: scopeKey, ids });
  const rows = query.data?.content ?? [];
  const selectedProducts = rows.filter((r) => selectedIds.includes(r.id));
  const allSelected = rows.length > 0 && selectedProducts.length === rows.length;
  const toggleOne = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

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

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => api(`/api/admin/products/${id}`, { method: "DELETE" })));
      const failed = results.filter((r) => r.status === "rejected").length;
      return { ok: ids.length - failed, failed };
    },
    onSuccess: ({ ok, failed }) => {
      refresh();
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      showToast({
        type: failed ? "error" : "success",
        title: failed ? "Xóa chưa hoàn tất" : "Đã xóa",
        message: failed ? `Đã xóa ${ok} sản phẩm, ${failed} sản phẩm không xóa được.` : `Đã xóa ${ok} sản phẩm.`,
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
              <Gift className="size-4" /> + Tạo Combo từ SP
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
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft/60 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-800">Đã chọn {selectedProducts.length} sản phẩm</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                Bỏ chọn
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <BulkButton
                  icon={<Eye className="size-4" />}
                  disabled={selectedProducts.length !== 1}
                  title="Xem sản phẩm trên trang bán hàng (chọn 1 sản phẩm)"
                  onClick={() => router.push(`/products/${selectedProducts[0].slug}`)}
                >
                  Xem
                </BulkButton>
                <BulkButton
                  icon={<Pencil className="size-4" />}
                  disabled={selectedProducts.length !== 1}
                  title="Sửa sản phẩm (chọn 1 sản phẩm)"
                  onClick={() => edit(selectedProducts[0])}
                >
                  Sửa
                </BulkButton>
                <BulkButton
                  icon={<BadgePercent className="size-4" />}
                  title="Đặt % giảm giá thêm (voucher) cho các sản phẩm đã chọn"
                  onClick={() => setBulkSaleOpen(true)}
                >
                  Thêm voucher
                </BulkButton>
                <BulkButton icon={<Trash2 className="size-4" />} tone="danger" title="Xóa các sản phẩm đã chọn" onClick={() => setBulkDeleteOpen(true)}>
                  Xóa
                </BulkButton>
              </div>
            </div>
          )}

          <Table
            head={["Sản phẩm", "Giá", "Tồn kho", "Đã bán", "Trạng thái", "Thao tác"]}
            leading={
              <input
                type="checkbox"
                aria-label="Chọn tất cả sản phẩm trong trang"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = selectedProducts.length > 0 && !allSelected;
                }}
                onChange={() => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))}
                className="size-4 cursor-pointer rounded border-slate-300 accent-brand"
              />
            }
          >
            {query.data.content.map((p) => (
              <tr key={p.id} className={`transition-colors hover:bg-slate-50/70 ${selectedIds.includes(p.id) ? "bg-brand-soft/40" : ""}`}>
                <td className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${p.name}`}
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="size-4 cursor-pointer rounded border-slate-300 accent-brand"
                  />
                </td>
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    <IconButton label="Sửa sản phẩm" onClick={() => edit(p)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label="Đặt % giảm giá thêm (cả combo)" onClick={() => setSalePicking(p)}>
                      <BadgePercent className="size-4" />
                    </IconButton>
                    {/* TẠM ẨN: điều chỉnh tồn kho (Kho). Bỏ comment và thêm `Boxes` vào import lucide-react khi cần dùng lại.
                    <IconButton
                      label="Điều chỉnh tồn kho"
                      onClick={() => {
                        const v = window.prompt("Điều chỉnh tồn kho (+ nhập thêm, - xuất bớt)", "10");
                        if (v && Number(v)) patch.mutate({ id: p.id, path: "stock", body: { delta: Number(v) } });
                      }}
                    >
                      <Boxes className="size-4" />
                    </IconButton>
                    */}
                    <IconButton
                      label={p.active ? "Ẩn sản phẩm khỏi trang bán hàng" : "Hiện sản phẩm trên trang bán hàng"}
                      onClick={() => patch.mutate({ id: p.id, path: "active", body: { active: !p.active } })}
                    >
                      {p.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </IconButton>
                    <IconButton label="Xóa vĩnh viễn sản phẩm" tone="danger" onClick={() => setDeletingProduct(p)} disabled={deleteProduct.isPending}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
          {salePicking && <ProductSaleDialog product={salePicking} onClose={() => setSalePicking(null)} onSaved={refresh} />}
          {bulkSaleOpen && selectedProducts.length > 0 && (
            <BulkSaleDialog
              products={selectedProducts}
              onClose={() => setBulkSaleOpen(false)}
              onSaved={() => {
                refresh();
                setSelectedIds([]);
              }}
            />
          )}
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

      {/* Hộp thoại xác nhận xóa nhiều sản phẩm đã chọn */}
      <ConfirmModal
        isOpen={bulkDeleteOpen}
        title="Xác nhận xóa các sản phẩm đã chọn"
        message={
          <div>
            Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="font-bold text-slate-900">{selectedProducts.length} sản phẩm</strong> sau không?
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
              {selectedProducts.map((sp) => <li key={sp.id} className="truncate">• {sp.name}</li>)}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Các sản phẩm sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống bán hàng và cơ sở dữ liệu.</p>
          </div>
        }
        confirmText={`Xóa ${selectedProducts.length} sản phẩm`}
        cancelText="Hủy bỏ"
        tone="danger"
        loading={bulkDelete.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDelete.mutate(selectedProducts.map((sp) => sp.id))}
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

/** Nút trên thanh thao tác hàng loạt (hiện khi đã tích chọn sản phẩm). */
function BulkButton({ icon, children, onClick, disabled, title, tone = "default" }: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:bg-brand-soft hover:text-brand"
      }`}
    >
      {icon}
      {children}
    </button>
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

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-700">
          Ảnh sản phẩm * – ảnh đầu tiên là ảnh chính –{" "}
          <b className={imageList.length < MIN_IMAGES || imageList.length > MAX_IMAGES ? "text-destructive" : "text-green-700"}>
            {imageList.length}/{MAX_IMAGES} ảnh (tối thiểu {MIN_IMAGES})
          </b>
        </span>
        <ImageUploader
          value={imageList}
          onChange={(urls) => set("images", urls.join("\n"))}
          max={MAX_IMAGES}
          onError={setError}
        />
      </div>

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
