import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { SiteChrome } from "@/components/layout/site-chrome";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { EmptyState, emptyStateButton } from "@/components/ui/empty-state";
import { getBestsellersCached } from "@/lib/catalog";

/** 404 toàn site (cả khi một trang gọi notFound()): có header / footer, nút quay về và vài món bán chạy để khách đi tiếp. */
export default function NotFound() {
  return (
    <SiteChrome>
      <EmptyState
        icon={SearchX}
        title="Không tìm thấy trang"
        description="Trang hoặc sản phẩm bạn cần không tồn tại, hoặc đã được chuyển đi nơi khác."
        actions={
          <>
            <Link href="/" className={emptyStateButton.primary}>Về trang chủ</Link>
            <Link href="/search" className={emptyStateButton.secondary}>Xem tất cả sản phẩm</Link>
          </>
        }
      />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Popular />
      </Suspense>
    </SiteChrome>
  );
}

/** Gợi ý món bán chạy; đọc dữ liệu trong Suspense để không chặn prerender. Backend lỗi thì chỉ bỏ phần gợi ý. */
async function Popular() {
  const popular = await getBestsellersCached(6).catch(() => []);
  if (popular.length === 0) return null;
  return (
    <>
      <SectionTitle title="Có thể bạn quan tâm" href="/search?sort=BESTSELLER" />
      <ProductGrid products={popular} />
    </>
  );
}
