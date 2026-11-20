import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { PageHeading } from "@/components/page-heading";
import { ProductFilterBar } from "@/components/product-filter-bar";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SortSelect } from "@/components/sort-select";
import { NavSelect } from "@/components/ui/nav-select";
import { getCategories, searchProducts } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/format";
import { filterParams, parseFilters } from "@/lib/product-filters";

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
  const filters = parseFilters(sp);

  const [categories, result] = await Promise.all([
    getCategories(),
    searchProducts({ category: slug, sort, page, size: 20, ...filters }),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PageHeading title={category.name} count={result.totalElements} />
      <div className="flex flex-wrap items-center gap-3 px-3 pb-4 md:px-0">
        <NavSelect
          label="Danh mục"
          icon={<LayoutGrid aria-hidden className="size-4" />}
          value={slug}
          options={categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.productCount})`, href: `/categories/${c.slug}` }))}
        />
        <SortSelect basePath={`/categories/${slug}`} params={filterParams(filters)} current={sort} />
      </div>
      <ProductFilterBar basePath={`/categories/${slug}`} params={{ sort }} filters={filters} />
      <ProductGrid products={result.content} />
      <Pagination basePath={`/categories/${slug}`} params={{ sort, ...filterParams(filters) }} page={result.page} totalPages={result.totalPages} />
    </>
  );
}
