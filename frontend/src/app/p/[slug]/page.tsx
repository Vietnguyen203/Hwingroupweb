import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/price";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { getProduct, searchProducts } from "@/lib/catalog";
import type { FoodInfo } from "@/lib/types";

/** Thẻ Open Graph để link CTV chia sẻ lên Facebook/Zalo hiển thị đẹp. */
export async function generateMetadata({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
    openGraph: { title: product.name, description: product.shortDescription ?? undefined, images: product.images.slice(0, 1) },
  };
}

/** Trang chi tiết sản phẩm: /p/[slug] */
export default function ProductPage(props: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<div className="aspect-square animate-pulse bg-neutral-200" />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = product.category
    ? (await searchProducts({ category: product.category.slug, sort: "BESTSELLER", size: 5 })).content
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  return (
    <div className="pb-6">
      <nav className="px-3 py-2 text-xs text-muted-foreground">
        <Link href="/">Trang chủ</Link>
        {product.category && (
          <> › <Link href={`/c/${product.category.slug}`}>{product.category.name}</Link></>
        )}
      </nav>

      <div className="md:grid md:grid-cols-2 md:gap-6 md:px-3">
        <div className="overflow-hidden md:rounded-xl">
          <ProductGallery images={product.images} alt={product.name} />
        </div>
        <div className="space-y-3 bg-white p-4 md:rounded-xl">
          <h1 className="text-xl leading-7 font-bold">{product.name}</h1>
          <div className="flex items-center gap-2">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {product.discountPercent > 0 && (
              <span className="rounded bg-brand px-1.5 py-0.5 text-xs font-bold text-white">-{product.discountPercent}%</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Đơn vị: {product.unit ?? "—"} · {product.inStock ? <span className="text-green-700">Còn hàng</span> : <span className="text-brand">Hết hàng</span>}
          </p>
          {product.shortDescription && <p className="text-sm">{product.shortDescription}</p>}
          <AddToCartButton
            variant="full"
            disabled={!product.inStock}
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

      {product.foodInfo && <FoodInfoTable info={product.foodInfo} />}

      {product.description && (
        <section className="mx-3 mt-4 rounded-xl bg-white p-4">
          <h2 className="mb-2 font-bold">Mô tả sản phẩm</h2>
          <p className="text-sm leading-6 whitespace-pre-line">{product.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <>
          <SectionTitle title="Sản phẩm cùng loại" href={`/c/${product.category?.slug}`} />
          <ProductGrid products={related} />
        </>
      )}
    </div>
  );
}

function FoodInfoTable({ info }: { info: FoodInfo }) {
  const rows: [string, string | null][] = [
    ["Nhà sản xuất", info.manufacturer],
    ["Hạn sử dụng", info.shelfLife],
    ["Bảo quản", info.storageInstructions],
    ["Số công bố sản phẩm", info.declarationNumber],
    ["Giấy chứng nhận ATTP", info.foodSafetyCertNumber],
  ];
  return (
    <section className="mx-3 mt-4 rounded-xl bg-white p-4">
      <h2 className="mb-2 font-bold">Thông tin sản phẩm</h2>
      <table className="w-full text-sm">
        <tbody>
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <th className="w-2/5 py-2 pr-2 text-left align-top font-normal text-muted-foreground">{k}</th>
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
