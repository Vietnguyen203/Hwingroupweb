import { Suspense } from "react";
import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import Link from "next/link";

import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { EmptyState, emptyStateButton } from "@/components/ui/empty-state";
import { VideoCard } from "@/components/video/video-card";
import { VideoFilterBar } from "@/components/video/video-filter-bar";
import { getCategories } from "@/lib/catalog";
import { parsePage } from "@/lib/format";
import { listVideos, type VideoPlatform } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Video trải nghiệm món ngon Phúc Vị | Phúc Vị Foods",
  description:
    "Thư viện video trải nghiệm thực tế món ăn, mẹo chế biến và review ẩm thực từ Facebook, TikTok và YouTube của Phúc Vị Foods.",
};

export default function VideosPage(props: PageProps<"/videos">) {
  return (
    <Suspense fallback={<VideosSkeleton />}>
      <VideosContent {...props} />
    </Suspense>
  );
}

async function VideosContent({ searchParams }: PageProps<"/videos">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) || undefined;
  const rawPlatform = (Array.isArray(sp.platform) ? sp.platform[0] : sp.platform)?.toUpperCase();
  const platform = rawPlatform === "YOUTUBE" || rawPlatform === "TIKTOK" || rawPlatform === "FACEBOOK" ? (rawPlatform as VideoPlatform) : undefined;
  const category = (Array.isArray(sp.category) ? sp.category[0] : sp.category)?.trim() || undefined;
  const page = parsePage(sp.page);

  const [result, categories] = await Promise.all([
    listVideos({ q, platform, category, page, size: 12 }),
    getCategories().catch(() => []),
  ]);

  const activeCategories = categories.filter((c) => c.productCount > 0);

  return (
    <div className="pb-12">
      <PageHeading
        title="Video trải nghiệm"
        subtitle={
          result.totalElements > 0
            ? `${result.totalElements} video đang chờ bạn khám phá`
            : "Khám phá video thực tế món ngon cùng Phúc Vị Foods"
        }
      />

      <VideoFilterBar
        currentPlatform={platform}
        currentCategory={category}
        currentQ={q}
        categories={activeCategories}
      />

      {result.content.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Chưa có video nào phù hợp"
          description={
            q || platform || category
              ? "Bạn thử đổi từ khóa tìm kiếm hoặc chọn nền tảng khác nhé."
              : "Các video trải nghiệm món ngon đang được đội ngũ chuẩn bị và sẽ sớm xuất hiện tại đây."
          }
          actions={
            q || platform || category ? (
              <Link href="/videos" className={emptyStateButton.secondary}>
                Xem tất cả video
              </Link>
            ) : (
              <Link href="/" className={emptyStateButton.primary}>
                Về trang chủ
              </Link>
            )
          }
          className="py-12 md:py-20"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-3">
            {result.content.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          <Pagination
            basePath="/videos"
            params={{
              q,
              platform,
              category,
            }}
            page={result.page}
            totalPages={result.totalPages}
          />
        </>
      )}
    </div>
  );
}

function VideosSkeleton() {
  return (
    <div className="pb-12">
      <div className="mb-5 h-28 animate-pulse bg-brand-honey/10 md:h-36" />
      <div className="mb-6 h-10 animate-pulse rounded-full bg-neutral-200" />
      <div className="grid grid-cols-1 gap-6 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.05]">
            <div className="aspect-video animate-pulse bg-neutral-200" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-neutral-200" />
              <div className="h-14 animate-pulse rounded-xl bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
