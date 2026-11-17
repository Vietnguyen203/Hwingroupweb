"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { useAdminList } from "@/hooks/use-admin-list";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { CategoryResponse } from "@/lib/types";
import { ActionButton, AdminPage, FilterBar, Loading, Select, Table } from "./admin-ui";

type FoodInfo = { manufacturer: string; shelfLife: string; storageInstructions: string; declarationNumber: string; foodSafetyCertNumber: string; foodSafetyCertUrl: string };
type AdminProductResponse = {
  id: string; categoryId: string; name: string; slug: string; price: number; compareAtPrice: number | null; shortDescription: string | null;
  description: string | null; unit: string | null; stock: number; active: boolean; bestseller: boolean; soldCount: number;
  images: string[]; foodInfo: Partial<FoodInfo> | null;
};
type Form = {
  id?: string; categoryId: string; name: string; slug: string; price: string; compareAtPrice: string; unit: string;
  shortDescription: string; description: string; initialStock: string; bestseller: boolean; images: string; foodInfo: FoodInfo;
};
const EMPTY_FOOD: FoodInfo = { manufacturer: "", shelfLife: "", storageInstructions: "", declarationNumber: "", foodSafetyCertNumber: "", foodSafetyCertUrl: "" };
const EMPTY: Form = { categoryId: "", name: "", slug: "", price: "", compareAtPrice: "", unit: "", shortDescription: "", description: "", initialStock: "0", bestseller: false, images: "", foodInfo: EMPTY_FOOD };

/** Quản lý sản phẩm: tìm / lọc danh mục, thêm / sửa, điều chỉnh tồn kho, ẩn / hiện. */
export function AdminProducts() {
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: () => api<CategoryResponse[]>("/api/admin/categories") });
  const { query, filters, setFilter, page, setPage } = useAdminList<AdminProductResponse>("/api/admin/products");
  const [form, setForm] = useState<Form | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "/api/admin/products"] });
  const patch = useMutation({
    mutationFn: ({ id, path, body }: { id: string; path: string; body: unknown }) => api(`/api/admin/products/${id}/${path}`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
  const cats = categories.data ?? [];
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "–";

  function edit(p: AdminProductResponse) {
    setForm({
      id: p.id, categoryId: p.categoryId, name: p.name, slug: p.slug, price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      unit: p.unit ?? "", shortDescription: p.shortDescription ?? "", description: p.description ?? "", initialStock: "0", bestseller: p.bestseller,
      images: p.images.join("\n"), foodInfo: { ...EMPTY_FOOD, ...Object.fromEntries(Object.entries(p.foodInfo ?? {}).map(([k, v]) => [k, v ?? ""])) },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPage title="Sản phẩm" actions={!form && <Button onClick={() => setForm({ ...EMPTY, categoryId: cats[0]?.id ?? "" })}>Thêm sản phẩm</Button>}>
      {form && <ProductForm form={form} setForm={setForm} categories={cats} onSaved={() => { setForm(null); refresh(); }} />}
      <FilterBar>
        <Input placeholder="Tên sản phẩm" defaultValue={filters.q ?? ""} className="h-9 w-56"
               onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value.trim()); }} />
        <Select value={filters.category ?? ""} onChange={(v) => setFilter("category", v)}
                options={[["", "Mọi danh mục"], ...cats.map((c) => [c.slug, c.name] as [string, string])]} />
      </FilterBar>
      {patch.error && <p className="text-sm text-destructive">{errorMessage(patch.error)}</p>}
      {query.isPending ? <Loading /> : query.error ? <p className="text-sm text-destructive">{errorMessage(query.error)}</p> : (
        <>
          <Table head={["Sản phẩm", "Danh mục", "Giá", "Tồn kho", "Đã bán", "Trạng thái", "Thao tác"]}>
            {query.data.content.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.images[0] ? <img src={p.images[0]} alt="" className="size-10 rounded object-cover" /> : <div className="size-10 rounded bg-neutral-100" />}
                    <span className="font-medium">{p.name}{p.bestseller && <span className="ml-1 text-xs text-brand-accent">★</span>}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{catName(p.categoryId)}</td>
                <td className="px-3 py-2">{formatVnd(p.price)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2">{p.soldCount}</td>
                <td className="px-3 py-2 text-xs">{p.active ? "Đang bán" : "Đã ẩn"}</td>
                <td className="space-x-1 px-3 py-2 whitespace-nowrap">
                  <ActionButton onClick={() => edit(p)}>Sửa</ActionButton>
                  <ActionButton onClick={() => {
                    const v = window.prompt("Điều chỉnh tồn kho (+ nhập thêm, - xuất bớt)", "10");
                    if (v && Number(v)) patch.mutate({ id: p.id, path: "stock", body: { delta: Number(v) } });
                  }}>Kho</ActionButton>
                  <ActionButton tone={p.active ? "danger" : "default"} onClick={() => patch.mutate({ id: p.id, path: "active", body: { active: !p.active } })}>
                    {p.active ? "Ẩn" : "Hiện"}
                  </ActionButton>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </AdminPage>
  );
}

function ProductForm({ form, setForm, categories, onSaved }: {
  form: Form; setForm: (f: Form | null) => void; categories: CategoryResponse[]; onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setForm({ ...form, [k]: v });
  const setFood = (k: keyof FoodInfo, v: string) => setForm({ ...form, foodInfo: { ...form.foodInfo, [k]: v } });

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.messageCode, body.message ?? "Tải ảnh thất bại");
    setForm({ ...form, images: [form.images.trim(), body.url].filter(Boolean).join("\n") });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const empty = (s: string) => (s.trim() ? s.trim() : null);
    const body = {
      categoryId: form.categoryId, name: form.name.trim(), slug: empty(form.slug), price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null, unit: empty(form.unit),
      shortDescription: empty(form.shortDescription), description: empty(form.description),
      initialStock: Number(form.initialStock || 0), bestseller: form.bestseller,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      foodInfo: Object.fromEntries(Object.entries(form.foodInfo).map(([k, v]) => [k, empty(v)])),
    };
    try {
      await api(form.id ? `/api/admin/products/${form.id}` : "/api/admin/products", { method: form.id ? "PUT" : "POST", body });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const input = (k: keyof Form, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input value={form[k] as string} onChange={(e) => set(k, e.target.value)} className="h-9" {...props} />
    </label>
  );
  const food = (k: keyof FoodInfo, label: string) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input value={form.foodInfo[k]} onChange={(e) => setFood(k, e.target.value)} className="h-9" />
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-bold text-brand">{form.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {input("name", "Tên sản phẩm", { required: true, maxLength: 255 })}
        <label className="block space-y-1">
          <span className="text-xs font-medium">Danh mục</span>
          <Select value={form.categoryId} onChange={(v) => set("categoryId", v)} className="w-full" options={categories.map((c) => [c.id, c.name])} />
        </label>
        {input("slug", "Slug (để trống = tự sinh)", { maxLength: 255 })}
        {input("price", "Giá bán (đ)", { required: true, type: "number", min: 1 })}
        {input("compareAtPrice", "Giá gốc (đ, không bắt buộc)", { type: "number", min: 1 })}
        {input("unit", "Đơn vị tính", { maxLength: 50, placeholder: "đòn 500g" })}
        {!form.id && input("initialStock", "Tồn kho ban đầu", { type: "number", min: 0 })}
        {input("shortDescription", "Mô tả ngắn", { maxLength: 500 })}
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Mô tả chi tiết</span>
        <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
                  className="w-full rounded-lg border border-input p-2 text-sm outline-none focus-visible:border-ring" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Ảnh (mỗi dòng một URL, ảnh đầu là ảnh chính)</span>
        <textarea rows={3} value={form.images} onChange={(e) => set("images", e.target.value)}
                  className="w-full rounded-lg border border-input p-2 font-mono text-xs outline-none focus-visible:border-ring" />
        <input type="file" accept="image/jpeg,image/png,image/webp" className="text-xs"
               onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f).catch((err) => setError(errorMessage(err))); e.target.value = ""; }} />
      </label>
      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer text-sm font-medium">Thông tin thực phẩm</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {food("manufacturer", "Nhà sản xuất")}
          {food("shelfLife", "Hạn sử dụng")}
          {food("storageInstructions", "Hướng dẫn bảo quản")}
          {food("declarationNumber", "Số tự công bố")}
          {food("foodSafetyCertNumber", "Số giấy chứng nhận ATTP")}
          {food("foodSafetyCertUrl", "Link giấy chứng nhận ATTP")}
        </div>
      </details>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.bestseller} onChange={(e) => set("bestseller", e.target.checked)} /> Gắn nhãn bán chạy
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu"}</Button>
        <Button type="button" variant="outline" onClick={() => setForm(null)}>Hủy</Button>
      </div>
    </form>
  );
}
