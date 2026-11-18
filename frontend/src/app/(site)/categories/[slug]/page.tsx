import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortSelect } from "@/components/sort-select";
import { NavSelect } from "@/components/ui/nav-select";
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
      <h1 className="px-3 pt-4 pb-3 text-2xl font-extrabold tracking-tight md:px-0 md:text-3xl">
        {category.name} <span className="ml-1 rounded-full bg-brand-soft px-2.5 py-0.5 align-middle text-sm font-bold text-brand">{result.totalElements} sản phẩm</span>
      </h1>
      <div className="flex flex-wrap items-center gap-3 px-3 pb-4 md:px-0">
        <NavSelect
          label="Danh mục"
          icon={<LayoutGrid aria-hidden className="size-4" />}
          value={slug}
          options={categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.productCount})`, href: `/categories/${c.slug}` }))}
        />
        <SortSelect basePath={`/categories/${slug}`} params={{}} current={sort} />
      </div>
      <ProductGrid products={result.content} />
      <Pagination basePath={`/categories/${slug}`} params={{ sort }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
