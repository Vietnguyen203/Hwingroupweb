"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ProductDetailResponse } from "@/lib/types";

/**
 * Chi tiết sản phẩm lấy theo nhu cầu (GET /api/products/{slug}, endpoint công khai có sẵn): dùng cho ảnh thứ hai
 * khi rê chuột lên thẻ và cho hộp "Xem nhanh". Chỉ gọi khi {@code enabled}; kết quả được cache nên không gọi lặp.
 */
export function useProductDetail(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["product-detail", slug],
    queryFn: () => api<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
