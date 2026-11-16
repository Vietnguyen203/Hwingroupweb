import { Suspense } from "react";

import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryMenu } from "@/components/home/category-menu";
import { Commitments } from "@/components/home/commitments";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { getBestsellers, getCategories, searchProducts } from "@/lib/catalog";

/** Trang chủ: banner – danh mục icon – bán chạy – combo – cam kết. */
export default function HomePage() {
  return (
    <>
      <BannerCarousel />
      <div className="pt-4">
        <Suspense fallback={<div className="mx-3 h-48 animate-pulse rounded-xl bg-neutral-200" />}>
          <Categories />
        </Suspense>
      </div>

      <SectionTitle title="Sản phẩm bán chạy" href="/search?sort=BESTSELLER" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Bestsellers />
      </Suspense>

      <SectionTitle title="Combo tiết kiệm" href="/c/combo" />
      <Suspense fallback={<ProductGridSkeleton count={2} />}>
        <Combos />
      </Suspense>

      <div className="pt-8">
        <Commitments />
      </div>
    </>
  );
}

async function Categories() {
  return <CategoryMenu categories={await getCategories()} />;
}

async function Bestsellers() {
  return <ProductGrid products={await getBestsellers(8)} />;
}

async function Combos() {
  const page = await searchProducts({ category: "combo", size: 4 });
  return <ProductGrid products={page.content} />;
}
