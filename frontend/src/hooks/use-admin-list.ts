"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PageResponse } from "@/lib/types";

/** Danh sách có lọc + phân trang cho trang admin. Đổi bộ lọc thì quay về trang 1. */
export function useAdminList<T>(path: string, initial: Record<string, string> = {}) {
  const [filters, setFiltersState] = useState<Record<string, string>>(initial);
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(page), page_size: "20" });
  const query = useQuery({
    queryKey: ["admin", path, qs.toString()],
    queryFn: () => api<PageResponse<T>>(`${path}?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
  const setFilter = (key: string, value: string) => {
    setFiltersState((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  return { query, filters, setFilter, page, setPage };
}
