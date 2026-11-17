import { Suspense } from "react";

import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryMenu } from "@/components/home/category-menu";
import { QuickTiles } from "@/components/home/quick-tiles";
import { SaleStrip } from "@/components/home/sale-strip";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { getBestsellers, getCategories, searchProducts } from "@/lib/catalog";

/**
 * Trang chủ (bố cục theo hwingroup.com):
 * banner – ô truy cập nhanh – danh mục icon – đang giảm giá – combo – bán chạy – sản phẩm mới.
 * Cam kết + đăng ký CTV nằm ở footer.
 */
export default function HomePage() {
  return (
    <>
      <BannerCarousel />
      <QuickTiles />

      <SectionTitle title="Danh mục sản phẩm" />
      <Suspense fallback={<div className="mx-3 h-40 animate-pulse rounded-xl bg-neutral-200" />}>
        <Categories />
      </Suspense>

      <Suspense fallback={<div className="mx-3 mt-6 h-72 animate-pulse rounded-2xl bg-neutral-200" />}>
        <OnSale />
      </Suspense>

      <SectionTitle title="Combo ưu đãi" href="/danh-muc/combo" />
      <Suspense fallback={<ProductGridSkeleton count={2} />}>
        <Combos />
      </Suspense>

      <SectionTitle title="Bán chạy" href="/tim-kiem?sort=BESTSELLER" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Bestsellers />
      </Suspense>

      <SectionTitle title="Sản phẩm mới" href="/tim-kiem" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Newest />
      </Suspense>
    </>
  );
}

async function Categories() {
  return <CategoryMenu categories={await getCategories()} />;
}

async function OnSale() {
  const page = await searchProducts({ sort: "BESTSELLER", size: 30 });
  return <SaleStrip products={page.content.filter((p) => p.discountPercent > 0).slice(0, 10)} />;
}

async function Combos() {
  return <ProductGrid products={(await searchProducts({ category: "combo", size: 5 })).content} />;
}

async function Bestsellers() {
  return <ProductGrid products={await getBestsellers(10)} />;
}

async function Newest() {
  return <ProductGrid products={(await searchProducts({ sort: "NEWEST", size: 10 })).content} />;
}
