import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ProductGrid } from "@/components/product/product-card";
import { SectionTitle } from "@/components/section-title";
import { PlatformBadge } from "@/components/video/platform-badge";
import { VideoEmbed } from "@/components/video/video-embed";
import { getVideo, PLATFORM_LABEL, safeSourceUrl, safeThumbnailUrl, toProductCard } from "@/lib/videos";

export async function generateMetadata({ params }: PageProps<"/videos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video || video.status !== "PUBLISHED") {
    return { title: "Không tìm thấy video | Phúc Vị Foods" };
  }

  const thumb = safeThumbnailUrl(video.thumbnailUrl);

  return {
    title: `${video.title} | Video trải nghiệm Phúc Vị`,
    description: video.description || `Xem video trải nghiệm món ngon "${video.title}" từ ${PLATFORM_LABEL[video.platform]} của Phúc Vị Foods.`,
    openGraph: {
      title: `${video.title} | Phúc Vị Foods`,
      description: video.description || `Xem video trải nghiệm món ngon từ ${PLATFORM_LABEL[video.platform]}.`,
      images: thumb ? [{ url: thumb }] : undefined,
    },
  };
}

export default function VideoDetailPage(props: PageProps<"/videos/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <VideoDetailContent {...props} />
    </Suspense>
  );
}

async function VideoDetailContent({ params }: PageProps<"/videos/[slug]">) {
  const { slug } = await params;
  const video = await getVideo(slug);

  if (!video || video.status !== "PUBLISHED") {
    notFound();
  }

  const source = safeSourceUrl(video.platform, video.sourceUrl);
  const formattedDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(video.createdAt));
  const productCards = video.products.map(toProductCard);

  return (
    <div className="pb-16 pt-4">
      {/* Đường dẫn */}
      <div className="px-3 md:px-0">
        <Breadcrumb items={[{ label: "Video", href: "/videos" }, { label: video.title }]} />
      </div>

      <div className="mt-4 px-3 md:px-0">
        {/* Khung video trung tâm */}
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl bg-neutral-900 shadow-xl">
            <VideoEmbed video={video} autoLoad={true} />
          </div>

          {/* Thông tin video */}
          <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <PlatformBadge platform={video.platform} />
              {video.category && (
                <Link
                  href={`/videos?category=${video.category.slug}`}
                  className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  {video.category.name}
                </Link>
              )}
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <Calendar className="size-3.5" />
                {formattedDate}
              </span>
            </div>

            <h1 className="mt-3.5 font-display text-2xl font-bold text-neutral-900 sm:text-3xl">
              {video.title}
            </h1>

            {video.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base whitespace-pre-line">
                {video.description}
              </p>
            )}

            {/* Hành động liên quan */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
              <Link
                href="/videos"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 transition hover:text-brand"
              >
                <ArrowLeft className="size-4" /> Quay lại danh sách video
              </Link>

              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-brand-soft hover:text-brand"
                >
                  Xem bài gốc trên {PLATFORM_LABEL[video.platform]} <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách món ăn trong video */}
        {productCards.length > 0 && (
          <section className="mt-12">
            <SectionTitle title={`Món ngon trong video (${productCards.length})`} />
            <ProductGrid products={productCards} />
          </section>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-3 pb-16 pt-6 md:px-0">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-200" />
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-neutral-800" />
      <div className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-20 w-full animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
