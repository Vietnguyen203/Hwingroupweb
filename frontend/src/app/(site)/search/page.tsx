import { Suspense } from "react";

import { Pagination } from "@/components/pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortSelect } from "@/components/sort-select";
import { searchProducts } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/format";

export const metadata = { title: "Tìm kiếm" };

/** Trang tìm kiếm không dấu: /search?q=&sort=&page= */
export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<div className="pt-4"><ProductGridSkeleton count={6} /></div>}>
      <SearchContent {...props} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) ?? "";
  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);
  const result = await searchProducts({ q, sort, page, size: 20 });

  return (
    <>
      <h1 className="px-3 pt-5 pb-3 text-2xl font-extrabold tracking-tight md:px-0 md:text-3xl">
        {q ? <>Kết quả cho “{q}”</> : "Tất cả sản phẩm"}{" "}
        <span className="ml-1 rounded-full bg-brand-soft px-2.5 py-0.5 align-middle text-sm font-bold text-brand">{result.totalElements}</span>
      </h1>
      <div className="px-3 pb-4 md:px-0">
        <SortSelect basePath="/search" params={{ q }} current={sort} />
      </div>
      <ProductGrid products={result.content} />
      <Pagination basePath="/search" params={{ q, sort }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
