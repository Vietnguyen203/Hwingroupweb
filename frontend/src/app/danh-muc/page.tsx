import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getCategories } from "@/lib/catalog";

export const metadata = { title: "Danh mục" };

/** Trang "Danh mục" (tab dưới đáy trên mobile). */
export default function CategoriesPage() {
  return (
    <div className="p-3">
      <h1 className="pb-3 text-lg font-bold">Danh mục sản phẩm</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-200" />}>
        <CategoryList />
      </Suspense>
    </div>
  );
}

async function CategoryList() {
  const categories = await getCategories();
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-white">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/danh-muc/${c.slug}`} className="flex items-center gap-3 px-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.iconUrl && <img src={c.iconUrl} alt="" className="size-12 rounded-full" />}
            <span className="flex-1 font-medium">{c.name}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
