"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff, FolderPlus, FolderTree, Image as ImageIcon, Layers, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import type { CategoryResponse } from "@/lib/types";
import { ImageUploader } from "@/components/ui/image-uploader";
import { CategoryAddProductsModal } from "./category-add-products-modal";
import { AdminPage, FilterBar, IconButton, Loading, Table } from "./admin-ui";

export type CategoryForm = {
  id?: string;
  name: string;
  slug: string;
  iconUrl: string;
  sortOrder: number;
  active: boolean;
};

export const EMPTY_CATEGORY_FORM: CategoryForm = {
  name: "",
  slug: "",
  iconUrl: "/sample/icons/cha-gio.svg",
  sortOrder: 1,
  active: true,
};

export const SAMPLE_ICONS = [
  { url: "/sample/icons/cha-gio.svg", label: "Chả & Giò 🍥" },
  { url: "/sample/icons/xuc-xich.svg", label: "Xúc xích 🌭" },
  { url: "/sample/icons/thit-che-bien.svg", label: "Thịt chế biến 🥩" },
  { url: "/sample/icons/hai-san.svg", label: "Hải sản 🦐" },
  { url: "/sample/icons/do-kho.svg", label: "Đồ khô 🍘" },
  { url: "/sample/icons/combo.svg", label: "Combo 🎁" },
  { url: "/sample/icons/banh-truyen-thong.svg", label: "Bánh 🫔" },
  { url: "/sample/icons/gia-vi-nuoc-cham.svg", label: "Gia vị 🥣" },
  { url: "/sample/icons/dac-san-vung-mien.svg", label: "Đặc sản 🏔️" },
  { url: "/sample/icons/qua-tang-gio-qua.svg", label: "Quà Tết 🧧" },
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Quản lý danh mục sản phẩm: Xem, Thêm mới, Chỉnh sửa, Bật/Tắt hiển thị */
export function AdminCategories() {
  const qc = useQueryClient();
  const [filterQuery, setFilterQuery] = useState("");
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [addingTo, setAddingTo] = useState<CategoryResponse | null>(null);

  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api<CategoryResponse[]>("/api/admin/categories"),
  });

  const products = useQuery({
    queryKey: ["admin-products-summary"],
    queryFn: () => api<{ content: { id: string; categoryId: string }[] }>("/api/admin/products?page_size=200"),
  });

  const countForCategory = (catId: string) =>
    products.data?.content?.filter((p) => p.categoryId === catId).length ?? 0;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["admin-products-summary"] });
  };

  const toggleActive = useMutation({
    mutationFn: (c: CategoryResponse) =>
      api<CategoryResponse>(`/api/admin/categories/${c.id}`, {
        method: "PUT",
        body: {
          name: c.name,
          slug: c.slug,
          iconUrl: c.iconUrl,
          sortOrder: c.sortOrder,
          active: !c.active,
        },
      }),
    onSuccess: (updated) => {
      refresh();
      showToast({
        type: "success",
        message: `Đã ${updated.active ? "bật hiển thị" : "ẩn"} danh mục "${updated.name}"!`,
      });
    },
    onError: (err) => {
      showToast({
        type: "error",
        title: "Lỗi cập nhật",
        message: errorMessage(err),
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api(`/api/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      if (deletingCategory) {
        showToast({
          type: "success",
          title: "Đã xóa",
          message: `Đã xóa danh mục "${deletingCategory.name}" thành công!`,
        });
      }
      setDeletingCategory(null);
    },
    onError: (err) => {
      showToast({
        type: "error",
        title: "Không thể xóa",
        message: errorMessage(err),
      });
    },
  });

  const list = (categories.data ?? []).filter((c) =>
    filterQuery ? c.name.toLowerCase().includes(filterQuery.toLowerCase()) || c.slug.includes(filterQuery) : true
  );

  function startEdit(c: CategoryResponse) {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      iconUrl: c.iconUrl ?? "",
      sortOrder: c.sortOrder,
      active: c.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPage
      title="Danh mục sản phẩm"
      actions={
        !form && (
          <Button
            onClick={() =>
              setForm({
                ...EMPTY_CATEGORY_FORM,
                sortOrder: (categories.data?.length ?? 0) + 1,
              })
            }
            className="gap-2 shadow-sm shadow-brand/20"
          >
            <Plus className="size-4" /> Thêm danh mục mới
          </Button>
        )
      }
    >
      {form && (
        <CategoryFormModal
          form={form}
          setForm={setForm}
          onSaved={(savedCat) => {
            showToast({
              type: "success",
              title: "Thành công",
              message: form.id
                ? `Đã cập nhật thông tin danh mục "${savedCat?.name ?? form.name}"!`
                : `Đã tạo danh mục mới "${savedCat?.name ?? form.name}" thành công!`,
            });
            setForm(null);
            refresh();
          }}
        />
      )}

      <FilterBar>
        <Input
          placeholder="Tìm theo tên danh mục..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="h-10 w-72"
        />
        <div className="text-xs text-slate-500 font-medium ml-auto">
          Tổng cộng: <strong className="text-slate-800">{list.length}</strong> danh mục
        </div>
      </FilterBar>

      {categories.isPending ? (
        <Loading />
      ) : categories.error ? (
        <p className="text-sm text-destructive">{errorMessage(categories.error)}</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <FolderTree className="size-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có danh mục nào</h3>
          <p className="mb-5 mt-1 max-w-sm text-xs text-slate-500">
            Toàn bộ danh mục đã được xóa sạch. Bạn có thể tự do bấm nút bên dưới để tạo danh mục đầu tiên theo ý muốn!
          </p>
          <Button
            onClick={() =>
              setForm({
                ...EMPTY_CATEGORY_FORM,
                sortOrder: 1,
              })
            }
            className="gap-2 shadow-sm shadow-brand/20"
          >
            <Plus className="size-4" /> Bắt đầu tạo danh mục mới
          </Button>
        </div>
      ) : (
        <Table head={["Danh mục", "Thứ tự", "Số sản phẩm", "Trạng thái", "Thao tác"]}>
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-4 py-3">
                {/* Bấm vào icon / tên danh mục là mở form sửa (giống bảng sản phẩm), không có nút "Sửa" riêng ở cột Thao tác.
                    Dùng <button> để bàn phím (Tab, Enter) cũng mở được; chỉ chứa phần tử dòng (span) cho đúng HTML. */}
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={`Sửa danh mục ${c.name}`}
                  title="Bấm để sửa danh mục"
                  className="group/edit flex w-full cursor-pointer items-center gap-3 rounded-lg text-left outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 shadow-2xs">
                    {c.iconUrl ? (
                      <Image src={c.iconUrl} alt="" width={36} height={36} className="size-8 object-contain" />
                    ) : (
                      <Layers className="size-5 text-slate-400" />
                    )}
                  </span>
                  <span className="font-semibold text-slate-800 transition-colors group-hover/edit:text-brand">{c.name}</span>
                </button>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">{c.sortOrder}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/products?category=${c.slug}`}
                  title="Bấm để xem các sản phẩm thuộc danh mục này"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition shadow-2xs"
                >
                  <strong className="text-slate-900">{countForCategory(c.id)}</strong> SP ↗
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${c.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {c.active ? "Đang hiển thị" : "Đã ẩn"}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {/* Nút biểu tượng như cột Thao tác của bảng sản phẩm */}
                <div className="inline-flex items-center gap-1.5">
                  <IconButton label="Thêm các sản phẩm đã có vào danh mục này" onClick={() => setAddingTo(c)}>
                    <Plus className="size-4" />
                  </IconButton>
                  <IconButton
                    label={c.active ? "Ẩn danh mục khỏi trang bán hàng" : "Hiện danh mục trên trang bán hàng"}
                    onClick={() => toggleActive.mutate(c)}
                    disabled={toggleActive.isPending}
                  >
                    {c.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconButton>
                  <IconButton label="Xóa danh mục" tone="danger" onClick={() => setDeletingCategory(c)} disabled={deleteCategory.isPending}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {addingTo && <CategoryAddProductsModal category={addingTo} categories={categories.data ?? []} onClose={() => setAddingTo(null)} />}

      {/* Hộp thoại xác nhận xóa danh mục hiện đại thay thế cho confirm của trình duyệt */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        title="Xác nhận xóa danh mục"
        message={
          <div>
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <strong className="font-bold text-slate-900">&ldquo;{deletingCategory?.name}&rdquo;</strong> không?
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Các sản phẩm hiện thuộc danh mục này sẽ tự động chuyển về trạng thái chưa phân loại (không bị xóa mất).
            </p>
          </div>
        }
        confirmText="Xác nhận xóa"
        cancelText="Giữ lại"
        tone="danger"
        loading={deleteCategory.isPending}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            deleteCategory.mutate(deletingCategory.id);
          }
        }}
      />
    </AdminPage>
  );
}

export function CategoryFormModal({
  form,
  setForm,
  onSaved,
}: {
  form: CategoryForm;
  setForm: (f: CategoryForm | null) => void;
  onSaved: (savedCat?: CategoryResponse) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Đường dẫn slug tự động sinh từ tên danh mục chuẩn tiếng Việt không dấu
      const generatedSlug = slugify(form.name.trim());
      const body = {
        name: form.name.trim(),
        slug: generatedSlug,
        iconUrl: form.iconUrl.trim() || null,
        sortOrder: Number(form.sortOrder || 1),
        active: form.active,
      };

      let result: CategoryResponse | undefined;
      if (form.id) {
        result = await api<CategoryResponse>(`/api/admin/categories/${form.id}`, { method: "PUT", body });
      } else {
        result = await api<CategoryResponse>("/api/admin/categories", { method: "POST", body });
      }
      onSaved(result);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {form.id ? "Chỉnh sửa danh mục" : "Tạo danh mục sản phẩm mới"}
          </h2>
          <p className="text-xs text-slate-500">
            Điền tên danh mục để phân loại sản phẩm trên toàn hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm(null)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          Đóng ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Tên danh mục */}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-700">Tên danh mục *</span>
          <Input
            required
            autoFocus
            placeholder="VD: Chả lụa & Giò thủ, Đồ khô, Bánh truyền thống..."
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm({
                ...form,
                name,
                slug: slugify(name),
              });
            }}
            className="h-11 text-sm font-medium"
          />
        </label>

        {/* Chọn Icon */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700">Icon danh mục</span>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_ICONS.map((icon) => {
              const isSelected = form.iconUrl === icon.url;
              return (
                <button
                  type="button"
                  key={icon.url}
                  onClick={() => setForm({ ...form, iconUrl: icon.url })}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? "border-brand bg-brand/10 text-brand ring-2 ring-brand/20 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative size-5">
                    <Image src={icon.url} alt={icon.label} fill className="object-contain" />
                  </div>
                  <span>{icon.label}</span>
                  {isSelected && <Check className="size-3.5 text-brand" />}
                </button>
              );
            })}
          </div>

          {/* Tải ảnh riêng (xem trước ngay) hoặc dán URL */}
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <ImageUploader
              value={form.iconUrl ? [form.iconUrl] : []}
              onChange={(urls) => setForm({ ...form, iconUrl: urls[0] ?? "" })}
              max={1}
              onError={setError}
              hint="Tải ảnh biểu tượng riêng (JPG, PNG, WebP tối đa 5MB) hoặc chọn mẫu ở trên."
            />
            <Input
              placeholder="Hoặc dán URL icon (VD: /sample/icons/cha-gio.svg)"
              value={form.iconUrl}
              onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
              className="h-9 min-w-[240px] flex-1 text-xs font-mono"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={busy} className="h-10 px-6 font-semibold shadow-sm shadow-brand/20">
            {busy ? "Đang lưu..." : form.id ? "Cập nhật danh mục" : "Tạo danh mục"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setForm(null)} className="h-10 px-5">
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
