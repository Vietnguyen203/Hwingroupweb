import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Price } from "@/components/product/price";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductTabs } from "@/components/product/product-tabs";
import { StarRating } from "@/components/product/star-rating";
import { SectionTitle } from "@/components/section-title";
import { ProductPageSkeleton } from "@/components/skeletons/page-skeletons";
import { getBestsellers, getProduct, getReviewSummary, searchProducts } from "@/lib/catalog";
import { formatVnd } from "@/lib/format";

/** Thẻ Open Graph để link CTV chia sẻ lên Facebook/Zalo hiển thị đẹp. */
export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
    openGraph: { title: product.name, description: product.shortDescription ?? undefined, images: product.images.slice(0, 1) },
  };
}

/** Trang chi tiết sản phẩm: /products/[slug] */
export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [summary, related, popular] = await Promise.all([
    getReviewSummary(product.id),
    product.category
      ? searchProducts({ category: product.category.slug, sort: "BESTSELLER", size: 7 }).then((r) =>
          r.content.filter((p) => p.id !== product.id).slice(0, 6))
      : Promise.resolve([]),
    getBestsellers(12),
  ]);
  // "Có thể bạn cũng thích": món bán chạy, bỏ chính sản phẩm này và những món đã hiện ở "cùng loại"
  const shownIds = new Set([product.id, ...related.map((p) => p.id)]);
  const alsoLike = popular.filter((p) => !shownIds.has(p.id)).slice(0, 6);

  const specs: [string, string | null][] = [
    ["Thương hiệu", product.brand],
    ["Khối lượng", product.weight],
    ["Đóng gói", product.packaging],
    ["Xuất xứ", product.origin],
  ];

  return (
    <div className="pb-6">
      <Breadcrumb
        className="px-3 py-3 md:px-0"
        items={[...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []), { label: product.name }]}
      />

      <div className="gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="bg-white p-3 md:rounded-2xl md:p-5 md:shadow-card md:ring-1 md:ring-black/[0.04]">
          <ProductGallery images={product.images.slice(0, 5)} alt={product.name} />
        </div>

        <div className="space-y-4 bg-white p-4 md:rounded-2xl md:p-7 md:shadow-card md:ring-1 md:ring-black/[0.04]">
          <div>
            <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-3xl">{product.name}</h1>
            <a href="#chi-tiet" className="mt-2 flex items-center gap-2 text-sm">
              <StarRating value={summary.average} />
              <span className="font-semibold text-[#e59500]">{summary.total > 0 ? summary.average.toFixed(1) : "Chưa có đánh giá"}</span>
              {summary.total > 0 && <span className="text-muted-foreground">({summary.total} đánh giá)</span>}
              <span className="text-muted-foreground">· Đã bán {product.soldCount}</span>
            </a>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4 ring-1 ring-brand/10">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {product.discountPercent > 0 && (
              <span className="rounded-lg bg-brand-red px-2.5 py-1 text-sm font-extrabold text-white">-{product.discountPercent}%</span>
            )}
          </div>

          {product.salePercent > 0 && (
            <p className="-mt-2 text-sm font-medium text-brand-red">
              Đã gồm giảm thêm {product.salePercent}% (giá niêm yết {formatVnd(product.basePrice)})
            </p>
          )}

          <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-sm">
            {specs.map(([k, v]) => v && (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            <dt className="text-muted-foreground">Tình trạng</dt>
            <dd className="font-medium">{product.inStock ? <span className="text-green-700">Còn hàng</span> : <span className="text-brand-red">Hết hàng</span>}</dd>
          </dl>

          {product.shortDescription && <p className="border-t pt-3 text-sm leading-6 text-neutral-700">{product.shortDescription}</p>}

          <ProductPurchase
            slug={product.slug}
            stock={product.stock}
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              imageUrl: product.images[0] ?? null,
            }}
          />
        </div>
      </div>

      <ProductTabs
        productId={product.id}
        description={product.description}
        ingredients={product.ingredients}
        features={product.features}
        usage={product.usageInstructions}
        storage={product.foodInfo?.storageInstructions ?? null}
        reviewCount={summary.total}
      />

      {product.foodInfo && (product.foodInfo.manufacturer || product.foodInfo.shelfLife || product.foodInfo.declarationNumber || product.foodInfo.foodSafetyCertNumber) && (
        <FoodInfoTable info={product.foodInfo} />
      )}

      {related.length > 0 && (
        <>
          <SectionTitle title="Sản phẩm cùng loại" href={`/categories/${product.category?.slug}`} />
          <ProductGrid products={related} />
        </>
      )}

      {alsoLike.length > 0 && (
        <>
          <SectionTitle title="Có thể bạn cũng thích" href="/search?sort=BESTSELLER" />
          <ProductGrid products={alsoLike} />
        </>
      )}
    </div>
  );
}

function FoodInfoTable({ info }: { info: NonNullable<Awaited<ReturnType<typeof getProduct>>>["foodInfo"] & object }) {
  const rows: [string, string | null][] = [
    ["Nhà sản xuất", info.manufacturer],
    ["Hạn sử dụng", info.shelfLife],
    ["Số công bố sản phẩm", info.declarationNumber],
    ["Giấy chứng nhận ATTP", info.foodSafetyCertNumber],
  ];
  return (
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/[0.04] md:p-6">
      <h2 className="mb-2 text-lg font-extrabold">Thông tin an toàn thực phẩm</h2>
      <table className="w-full text-sm">
        <tbody>
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <th className="w-2/5 py-2 pr-2 text-left align-top font-normal text-muted-foreground md:w-1/4">{k}</th>
              <td className="py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {info.foodSafetyCertUrl && (
        <a href={info.foodSafetyCertUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand underline">
          Xem giấy chứng nhận ATTP
        </a>
      )}
    </section>
  );
}
