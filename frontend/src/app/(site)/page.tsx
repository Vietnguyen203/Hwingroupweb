import { Suspense } from "react";

import { BannerCarousel, type BannerSlide } from "@/components/home/banner-carousel";
import { CategoryMenu } from "@/components/home/category-menu";
import { ComboFeature } from "@/components/home/combo-feature";
import { QuickTiles } from "@/components/home/quick-tiles";
import { AffiliateBanner } from "@/components/home/affiliate-banner";
import { SaleStrip } from "@/components/home/sale-strip";
import { WhyHwin } from "@/components/home/why-hwin";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { getBestsellersCached, getCategories, searchProductsCached } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Trang chủ (bố cục theo hwingroup.com), ưu tiên mua sắm:
 * banner – ô truy cập nhanh – danh mục – đang giảm giá – combo – bán chạy – khối CTV – sản phẩm mới – Hãy đồng hành cùng HWIN.
 * Web phục vụ cộng tác viên nên khối CTV nằm giữa trang (sau các món bán chạy), không bị đẩy xuống cuối.
 * Mỗi khối có `id` để thanh "đi nhanh" dưới header (QuickJumpBar) nhảy tới: categories, on-sale, combos, bestsellers,
 * affiliate, newest, why-hwin. Thêm / đổi khối thì sửa danh sách HOME_SECTIONS ở quick-jump-bar.tsx cho khớp.
 * Khối nào không có dữ liệu (danh mục, giảm giá, combo, bán chạy, sản phẩm mới) thì ẩn cả khối: tiêu đề, nội dung và
 * tab tương ứng ở thanh đi nhanh (tab tự ẩn vì id nằm trong khối), không hiện khung "Không có sản phẩm".
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="mx-3 mt-3 aspect-[12/5] animate-pulse rounded-2xl bg-neutral-200 md:mx-0" />}>
        <Banners />
      </Suspense>
      <QuickTiles />

      <Suspense
        fallback={
          <HomeSection id="categories" title="Danh mục sản phẩm">
            <div className="mx-3 h-40 animate-pulse rounded-xl bg-neutral-200 md:mx-0" />
          </HomeSection>
        }
      >
        <Categories />
      </Suspense>

      <Suspense fallback={<div className="mx-3 mt-8 h-72 animate-pulse rounded-2xl bg-neutral-200 md:mx-0" />}>
        <OnSale />
      </Suspense>

      {/* Chỉ hiển thị khối Combo ưu đãi khi thực sự có sản phẩm combo */}
      <Suspense fallback={null}>
        <Combos />
      </Suspense>

      <Suspense
        fallback={
          <HomeSection id="bestsellers" title="Bán chạy" href="/search?sort=BESTSELLER">
            <ProductGridSkeleton />
          </HomeSection>
        }
      >
        <Bestsellers />
      </Suspense>

      <AffiliateBanner />

      <Suspense
        fallback={
          <HomeSection id="newest" title="Sản phẩm mới" href="/search">
            <ProductGridSkeleton />
          </HomeSection>
        }
      >
        <Newest />
      </Suspense>

      <section id="why-hwin" className="scroll-mt-sticky">
        <SectionTitle title="Hãy đồng hành cùng HWIN" />
        <WhyHwin />
      </section>
    </>
  );
}

/** Một khối của trang chủ: có `id` cho thanh đi nhanh, tiêu đề và nội dung. Dùng cả cho khung chờ lẫn khối đã tải xong. */
function HomeSection({ id, title, href, children }: { id: string; title: string; href?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-sticky">
      <SectionTitle title={title} href={href} />
      {children}
    </section>
  );
}

/** Banner: xen kẽ sản phẩm mới và bán chạy, bỏ trùng, tối đa 5. */
async function Banners() {
  const [newest, best] = await Promise.all([searchProductsCached({ sort: "NEWEST", size: 5 }), getBestsellersCached(5)]);
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
  // Danh mục chưa có sản phẩm nào đang bán thì không hiện ở trang chủ
  const categories = (await getCategories()).filter((c) => c.productCount > 0);
  if (categories.length === 0) return null; // không có danh mục nào thì ẩn cả khối (kể cả tiêu đề)
  return (
    <HomeSection id="categories" title="Danh mục sản phẩm">
      <CategoryMenu categories={categories} />
    </HomeSection>
  );
}

async function OnSale() {
  const page = await searchProductsCached({ sort: "BESTSELLER", size: 30 });
  return <SaleStrip products={page.content.filter((p) => p.discountPercent > 0).slice(0, 10)} />;
}

async function Combos() {
  // Tìm kiếm combo theo slug danh mục 'combo' hoặc từ khóa 'combo'
  const [byCat, byQuery] = await Promise.all([
    searchProductsCached({ category: "combo", size: 8 }).catch(() => ({ content: [] })),
    searchProductsCached({ q: "combo", size: 8 }).catch(() => ({ content: [] })),
  ]);

  const map = new Map<string, (typeof byCat.content)[0]>();
  byCat.content.forEach((p) => map.set(p.id, p));
  byQuery.content.forEach((p) => map.set(p.id, p));
  const products = Array.from(map.values()).slice(0, 4);

  // Nếu chưa có sản phẩm combo nào thì ẩn hoàn toàn phần này
  if (products.length === 0) {
    return null;
  }

  return (
    <section id="combos" className="scroll-mt-sticky">
      <SectionTitle title="Combo ưu đãi" href="/search?q=combo" />
      {/* 1–2 combo: thẻ ngang nổi bật; từ 3 combo trở lên: lưới thẻ thường */}
      {products.length <= 2 ? (
        <div className={cn("grid gap-4 px-3 md:px-0", products.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-3xl")}>
          {products.map((p) => <ComboFeature key={p.id} product={p} />)}
        </div>
      ) : (
        <ProductGrid products={products} className="lg:grid-cols-4 xl:grid-cols-4" />
      )}
    </section>
  );
}

async function Bestsellers() {
  const products = await getBestsellersCached(12);
  if (products.length === 0) return null; // chưa có sản phẩm bán chạy thì ẩn cả khối
  return (
    <HomeSection id="bestsellers" title="Bán chạy" href="/search?sort=BESTSELLER">
      <ProductGrid products={products} />
    </HomeSection>
  );
}

async function Newest() {
  const products = (await searchProductsCached({ sort: "NEWEST", size: 12 })).content;
  if (products.length === 0) return null; // chưa có sản phẩm nào thì ẩn cả khối
  return (
    <HomeSection id="newest" title="Sản phẩm mới" href="/search">
      <ProductGrid products={products} />
    </HomeSection>
  );
}
