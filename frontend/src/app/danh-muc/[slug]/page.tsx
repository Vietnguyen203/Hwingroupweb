import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortTabs } from "@/components/sort-tabs";
import { getCategories, searchProducts } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/format";

/** Trang danh mục: /c/[slug]?sort=&page= */
export default function CategoryPage(props: PageProps<"/danh-muc/[slug]">) {
  return (
    <Suspense fallback={<div className="pt-4"><ProductGridSkeleton count={6} /></div>}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/danh-muc/[slug]">) {
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
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-3 pb-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/danh-muc/${c.slug}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${c.slug === slug ? "bg-brand-soft font-semibold text-brand" : "bg-white"}`}
          >
            {c.name}
          </a>
        ))}
      </div>
      <h1 className="px-3 pt-2 pb-3 text-xl font-bold">
        {category.name} <span className="text-sm font-normal text-muted-foreground">({result.totalElements} sản phẩm)</span>
      </h1>
      <SortTabs basePath={`/danh-muc/${slug}`} params={{}} current={sort} />
      <ProductGrid products={result.content} />
      <Pagination basePath={`/danh-muc/${slug}`} params={{ sort }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
