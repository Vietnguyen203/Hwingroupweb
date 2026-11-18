import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortTabs } from "@/components/sort-tabs";
import { getCategories, searchProducts } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/format";

/** Trang danh mục: /c/[slug]?sort=&page= */
export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<div className="pt-4"><ProductGridSkeleton count={6} /></div>}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);

  const [categories, result] = await Promise.all([
    getCategories(),
    searchProducts({ category: slug, sort, page, size: 20 }),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-4 pb-3 md:px-0">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/categories/${c.slug}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition duration-200 active:scale-95 ${c.slug === slug ? "bg-brand text-white shadow-md shadow-brand/25 ring-brand" : "bg-white text-neutral-700 ring-black/[0.08] hover:text-brand hover:ring-brand/40"}`}
          >
            {c.name}
          </a>
        ))}
      </div>
      <h1 className="px-3 pt-2 pb-3 text-2xl font-extrabold tracking-tight md:px-0 md:text-3xl">
        {category.name} <span className="ml-1 rounded-full bg-brand-soft px-2.5 py-0.5 align-middle text-sm font-bold text-brand">{result.totalElements} sản phẩm</span>
      </h1>
      <SortTabs basePath={`/categories/${slug}`} params={{}} current={sort} />
      <ProductGrid products={result.content} />
      <Pagination basePath={`/categories/${slug}`} params={{ sort }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
