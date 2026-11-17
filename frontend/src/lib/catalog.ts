// Gọi API catalog từ Server Component (SSR). Không cache: dữ liệu giá/tồn kho luôn mới.
import { cache } from "react";

import { backendUrl } from "./config";
import type { Category, Page, ProductCard, ProductDetail, ProductSort } from "./types";

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${backendUrl}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend ${res.status} khi gọi ${path}`);
  return (await res.json()) as T;
}

/** cache(): header, menu và trang dùng chung một lần gọi trong cùng request. */
export const getCategories = cache(async (): Promise<Category[]> => {
  return (await get<Category[]>("/api/categories")) ?? [];
});

export async function getBestsellers(limit = 8): Promise<ProductCard[]> {
  return (await get<ProductCard[]>(`/api/products/bestsellers?limit=${limit}`)) ?? [];
}

export type SearchParams = {
  q?: string;
  category?: string;
  sort?: ProductSort;
  page?: number;
  size?: number;
};

export async function searchProducts(params: SearchParams): Promise<Page<ProductCard>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.sort) qs.set("sort", params.sort);
  qs.set("page", String((params.page ?? 0) + 1)); // API: trang bắt đầu từ 1
  qs.set("page_size", String(params.size ?? 20));
  const page = await get<Page<ProductCard>>(`/api/products?${qs.toString()}`);
  // giao diện dùng trang 0-based (Pagination) -> đổi lại
  return page ? { ...page, page: page.page - 1 } : { content: [], page: 0, pageSize: 20, totalElements: 0, totalPages: 0 };
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  return get<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
}
