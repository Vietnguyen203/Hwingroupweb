import { Suspense } from "react";

import { Pagination } from "@/components/pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortTabs } from "@/components/sort-tabs";
import { searchProducts } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/format";

export const metadata = { title: "Tìm kiếm" };

/** Trang tìm kiếm không dấu: /search?q=&sort=&page= */
export default function SearchPage(props: PageProps<"/tim-kiem">) {
  return (
    <Suspense fallback={<div className="pt-4"><ProductGridSkeleton count={6} /></div>}>
      <SearchContent {...props} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: PageProps<"/tim-kiem">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) ?? "";
  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);
  const result = await searchProducts({ q, sort, page, size: 20 });

  return (
    <>
      <h1 className="px-3 pt-4 pb-3 text-lg font-bold">
        {q ? <>Kết quả cho “{q}”</> : "Tất cả sản phẩm"}{" "}
        <span className="text-sm font-normal text-muted-foreground">({result.totalElements})</span>
      </h1>
      <SortTabs basePath="/tim-kiem" params={{ q }} current={sort} />
      <ProductGrid products={result.content} />
      <Pagination basePath="/tim-kiem" params={{ q, sort }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
