import { Suspense } from "react";

import { BannerCarousel, type BannerSlide } from "@/components/home/banner-carousel";
import { CategoryMenu } from "@/components/home/category-menu";
import { QuickTiles } from "@/components/home/quick-tiles";
import { AffiliateBanner } from "@/components/home/affiliate-banner";
import { SaleStrip } from "@/components/home/sale-strip";
import { WhyHwin } from "@/components/home/why-hwin";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { getBestsellers, getCategories, searchProducts } from "@/lib/catalog";

/**
 * Trang chủ (bố cục theo hwingroup.com):
 * banner – ô truy cập nhanh – đang giảm giá – danh mục – combo – khối CTV – bán chạy – vì sao chọn HWIN – sản phẩm mới.
 * Web phục vụ cộng tác viên nên khối CTV đặt nổi bật giữa trang.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="mx-3 mt-3 aspect-[12/5] animate-pulse rounded-2xl bg-neutral-200 md:mx-0" />}>
        <Banners />
      </Suspense>
      <QuickTiles />

      <Suspense fallback={<div className="mx-3 mt-8 h-72 animate-pulse rounded-2xl bg-neutral-200" />}>
        <OnSale />
      </Suspense>

      <SectionTitle title="Danh mục sản phẩm" />
      <Suspense fallback={<div className="mx-3 h-40 animate-pulse rounded-xl bg-neutral-200" />}>
        <Categories />
      </Suspense>

      <SectionTitle title="Combo ưu đãi" href="/danh-muc/combo" />
      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <Combos />
      </Suspense>

      <AffiliateBanner />

      <SectionTitle title="Bán chạy" href="/tim-kiem?sort=BESTSELLER" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Bestsellers />
      </Suspense>

      <SectionTitle title="Vì sao chọn HWIN" />
      <WhyHwin />

      <SectionTitle title="Sản phẩm mới" href="/tim-kiem" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Newest />
      </Suspense>
    </>
  );
}

/** Banner: xen kẽ sản phẩm mới và bán chạy, bỏ trùng, tối đa 5. */
async function Banners() {
  const [newest, best] = await Promise.all([searchProducts({ sort: "NEWEST", size: 5 }), getBestsellers(5)]);
  const slides: BannerSlide[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 5 && slides.length < 5; i++) {
    for (const [p, tag] of [[newest.content[i], "Mới"], [best[i], "Bán chạy"]] as const) {
      if (p && !seen.has(p.id) && slides.length < 5) {
        seen.add(p.id);
        slides.push({ product: p, tag });
      }
    }
  }
  return <BannerCarousel slides={slides} />;
}

async function Categories() {
  return <CategoryMenu categories={await getCategories()} />;
}

async function OnSale() {
  const page = await searchProducts({ sort: "BESTSELLER", size: 30 });
  return <SaleStrip products={page.content.filter((p) => p.discountPercent > 0).slice(0, 10)} />;
}

async function Combos() {
  return <ProductGrid products={(await searchProducts({ category: "combo", size: 4 })).content} className="lg:grid-cols-4 xl:grid-cols-4" />;
}

async function Bestsellers() {
  return <ProductGrid products={await getBestsellers(12)} />;
}

async function Newest() {
  return <ProductGrid products={(await searchProducts({ sort: "NEWEST", size: 12 })).content} />;
}
