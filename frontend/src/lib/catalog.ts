// Gọi API catalog từ Server Component (SSR).
// - Chi tiết sản phẩm, tìm kiếm, trang danh mục: KHÔNG cache – giá / tồn kho luôn mới.
// - Danh mục và các danh sách ở trang chủ (getCategories, getBestsellersCached, searchProductsCached): nhớ NGẮN (60 giây) trong
//   bộ nhớ server để mỗi lượt xem trang chủ không phải gọi backend ~9 lần. Giá khi đặt hàng luôn do backend tính lại.
//   Dùng bộ nhớ tự quản thay cho `use cache` của Next vì `use cache` buộc backend phải chạy lúc `next build`.
import { cache } from "react";
import { connection } from "next/server";

import { backendUrl } from "./config";
import type { ProductReviewSummaryResponse } from "./reviews";
import type { CategoryResponse, PageResponse, ProductCardResponse, ProductDetailResponse, ProductSort } from "./types";

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${backendUrl}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend ${res.status} khi gọi ${path}`);
  return (await res.json()) as T;
}

const SHORT_TTL_MS = 60_000;
const MAX_ENTRIES = 50;
const shortCache = new Map<string, { at: number; value: Promise<unknown> }>();

/** Nhớ kết quả theo khóa trong SHORT_TTL_MS, gộp cả các lời gọi đồng thời; lỗi không được nhớ (lần sau gọi lại backend). */
async function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  // Dữ liệu theo từng request: không prerender lúc build (build không cần backend) và sau dòng này mới được đọc giờ (Date.now)
  await connection();
  const hit = shortCache.get(key);
  if (hit && Date.now() - hit.at < SHORT_TTL_MS) return hit.value as Promise<T>;

  const value = load();
  if (shortCache.size >= MAX_ENTRIES) shortCache.delete(shortCache.keys().next().value!);
  shortCache.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (shortCache.get(key)?.value === value) shortCache.delete(key);
  });
  return value;
}

/** Nhớ ngắn (xem đầu file) + cache() của React: header, menu và trang dùng chung một lần gọi trong cùng request. */
export const getCategories = cache(
  (): Promise<CategoryResponse[]> => remember("categories", async () => (await get<CategoryResponse[]>("/api/categories")) ?? []),
);

export async function getBestsellers(limit = 8): Promise<ProductCardResponse[]> {
  return (await get<ProductCardResponse[]>(`/api/products/bestsellers?limit=${limit}`)) ?? [];
}

/** Như getBestsellers nhưng nhớ ngắn – chỉ dùng ở trang chủ (not-found và trang sản phẩm vẫn gọi bản không nhớ). */
export function getBestsellersCached(limit = 8): Promise<ProductCardResponse[]> {
  return remember(`bestsellers:${limit}`, () => getBestsellers(limit));
}

export type SearchParams = {
  q?: string;
  category?: string;
  sort?: ProductSort;
  page?: number;
  size?: number;
  /** Giá khách thực trả (VND), đã gồm cả mốc. */
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
};

export async function searchProducts(params: SearchParams): Promise<PageResponse<ProductCardResponse>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.sort) qs.set("sort", params.sort);
  if (params.minPrice) qs.set("min_price", String(params.minPrice));
  if (params.maxPrice) qs.set("max_price", String(params.maxPrice));
  if (params.inStock) qs.set("in_stock", "true");
  if (params.onSale) qs.set("on_sale", "true");
  qs.set("page", String((params.page ?? 0) + 1)); // API: trang bắt đầu từ 1
  qs.set("page_size", String(params.size ?? 20));
  const page = await get<PageResponse<ProductCardResponse>>(`/api/products?${qs.toString()}`);
  // giao diện dùng trang 0-based (Pagination) -> đổi lại
  return page ? { ...page, page: page.page - 1 } : { content: [], page: 0, pageSize: 20, totalElements: 0, totalPages: 0 };
}

/** Như searchProducts nhưng nhớ ngắn – chỉ dùng cho các khối danh sách ở trang chủ (không dùng cho tìm kiếm / trang danh mục). */
export function searchProductsCached(params: SearchParams): Promise<PageResponse<ProductCardResponse>> {
  return remember(`search:${JSON.stringify(params)}`, () => searchProducts(params));
}

export async function getProduct(slug: string): Promise<ProductDetailResponse | null> {
  return get<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`);
}

/** Tổng hợp đánh giá của sản phẩm (điểm trung bình + số lượng); lỗi mạng -> coi như chưa có đánh giá. */
export async function getReviewSummary(productId: string): Promise<ProductReviewSummaryResponse> {
  const empty = { average: 0, total: 0, countByRating: {} };
  try {
    return (await get<ProductReviewSummaryResponse>(`/api/product-reviews/summary?productId=${productId}`)) ?? empty;
  } catch {
    return empty;
  }
}
